import type { Request, Response } from "express";
import mongoose from "mongoose";
import { processDirectorMessage } from "../services/director.service.js";
import { runVideoPipeline, type VideoProject } from "../services/videoPipeline.service.js";
import type { VideoSettings } from "../services/director.service.js";
import DocumentModel from "../models/Document.model.js";
import { generateSceneImages } from "../services/imageGeneration.service.js";
import { generateNarrations } from "../services/tts.service.js";
import { renderVideo } from "../services/videoRenderer.service.js";
import { sseManager } from "../services/sse.service.js";

interface DirectorJob {
  status: "running" | "completed" | "failed";
  progress: string[];
  result?: VideoProject;
  error?: string;
}

const directorJobs = new Map<string, DirectorJob>();

export async function directorChat(req: Request, res: Response): Promise<void> {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ success: false, message: "message is required" });
    return;
  }

  try {
    const result = await processDirectorMessage(message);
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[DIRECTOR] Failed:", msg);
    res.status(500).json({ success: false, message: msg });
  }
}

export async function startDirectorVideoGeneration(req: Request, res: Response): Promise<void> {
  const { documentId, settings, action = "full" } = req.body as { documentId?: unknown; settings?: VideoSettings; action?: "full" | "images" | "narration" | "render" };
  if (!documentId || typeof documentId !== "string" || !mongoose.Types.ObjectId.isValid(documentId)) {
    res.status(400).json({ success: false, message: "Please upload a PDF first." });
    return;
  }

  const jobId = new mongoose.Types.ObjectId().toString();
  const job: DirectorJob = { status: "running", progress: ["🎬 Starting video generation..."] };
  directorJobs.set(jobId, job);
  res.status(202).json({ success: true, jobId });

  const emit = (step: string, status: "running" | "completed" | "failed", data?: { current?: number; total?: number; message?: string }) => {
    sseManager.emitProgress(documentId, { step, status, ...data });
  };

  const execute = async (): Promise<VideoProject> => {
    if (action === "full") {
      return runVideoPipeline(documentId, {
        force: true,
        settings,
        onProgress: (message) => job.progress.push(message),
        onStepProgress: (progress) => sseManager.emitProgress(documentId, progress),
      });
    }

    const document = await DocumentModel.findById(documentId);
    if (!document?.storyboard?.scenes.length) throw new Error("Create a storyboard before running this action.");
    if (action === "images") {
      emit("images", "running", { current: 0, total: document.storyboard.scenes.length });
      document.storyboard.scenes = await generateSceneImages(documentId, document.storyboard.scenes, {
        force: true,
        onProgress: (current, total) => emit("images", "running", { current, total }),
      });
      await document.save();
      emit("images", "completed");
    } else if (action === "narration") {
      emit("audio", "running", { current: 0, total: document.storyboard.scenes.length });
      document.storyboard.scenes = await generateNarrations(documentId, document.storyboard.scenes, {
        force: true,
        voice: settings?.voice,
        onProgress: (current, total) => emit("audio", "running", { current, total }),
      });
      await document.save();
      emit("audio", "completed");
    } else {
      emit("clips", "running", { current: 0, total: document.storyboard.scenes.length });
      await renderVideo(documentId, { scenes: document.storyboard.scenes, settings }, true, (current, total) => {
        emit("clips", "running", { current, total });
      });
      emit("clips", "completed");
      emit("rendering", "running", { current: 0, total: 100 });
      emit("rendering", "running", { current: 50, total: 100 });
      emit("rendering", "running", { current: 100, total: 100 });
      emit("rendering", "completed");
    }
    return {
      title: document.overview?.title ?? document.originalName,
      duration: document.overview?.duration ?? "",
      sceneCount: document.storyboard.scenes.length,
      scenes: document.storyboard.scenes,
      settings,
    };
  };

  void execute().then((result) => {
    job.result = result;
    job.status = "completed";
    job.progress.push("✅ Video generation completed.");
    sseManager.emitComplete(documentId, "Video generated successfully");
  }).catch((error: unknown) => {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : String(error);
    sseManager.emitError(documentId, error instanceof Error ? error.message : String(error));
  });
}

export async function getDirectorVideoGenerationStatus(req: Request, res: Response): Promise<void> {
  const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const job = directorJobs.get(jobId);
  if (!job) {
    res.status(404).json({ success: false, message: "Video generation job not found." });
    return;
  }
  res.json({ success: true, ...job });
}
