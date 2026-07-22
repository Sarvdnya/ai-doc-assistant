import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { runVideoPipeline } from "../services/videoPipeline.service.js";
import { sseManager } from "../services/sse.service.js";

const GENERATED_DIR = path.resolve(import.meta.dirname, "..", "..", "generated");
const PORT = process.env.PORT ?? "5000";

export async function generateVideo(
  req: Request,
  res: Response
): Promise<void> {
  const { documentId, settings, force = false } = req.body;

  console.log("[VIDEO] Incoming documentId:", documentId);

  if (!documentId || typeof documentId !== "string") {
    res.status(400).json({ success: false, message: "documentId is required" });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    res.status(400).json({ success: false, message: "Invalid documentId" });
    return;
  }

  try {
    console.log("[VIDEO] Starting pipeline");
    const project = await runVideoPipeline(documentId, {
      force: force === true,
      settings,
      onStepProgress: (progress) => sseManager.emitProgress(documentId, progress),
    });
    console.log("[VIDEO] Pipeline request completed");

    const outputPath = path.join(GENERATED_DIR, documentId, "output", "overview.mp4");
    if (!fs.existsSync(outputPath)) {
      res.status(500).json({
        success: false,
        message: "Video file was not created on disk",
      });
      return;
    }

    res.json({
      success: true,
      videoUrl: `http://localhost:${PORT}/generated/${documentId}/output/overview.mp4`,
      title: project.title,
      duration: project.duration,
      sceneCount: project.sceneCount,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    console.error("[VIDEO] Pipeline failed\n" + msg);

    if (msg.includes("not found")) {
      res.status(404).json({
        success: false,
        message: msg,
        requestedId: documentId,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: msg,
    });
  }
}
