import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import DocumentModel from "../models/Document.model.js";
import { generateOverview, type Overview } from "./overview.service.js";
import { generateImagePrompts } from "./imagePrompt.service.js";
import { generateSceneImages } from "./imageGeneration.service.js";
import { generateNarrations } from "./tts.service.js";
import { renderVideo } from "./videoRenderer.service.js";
import { resolveVideoSettings, type VideoSettings } from "./director.service.js";

export interface StepProgress {
  step: string;
  status: "running" | "completed" | "failed";
  current?: number;
  total?: number;
  message?: string;
}

const GENERATED_DIR = path.resolve(import.meta.dirname, "../..", "generated");

function docDir(documentId: string, ...subdirs: string[]): string {
  return path.join(GENERATED_DIR, documentId, ...subdirs);
}

function storyboardPath(documentId: string): string {
  return docDir(documentId, "metadata", `${documentId}.json`);
}

function parseDurationSeconds(dur: string): number {
  const m = dur.match(/(\d+(?:\.\d+)?)\s*sec/);
  return m ? parseFloat(m[1]) : 8;
}

function sceneFilename(scene: number, extension: "png" | "mp3"): string {
  return `scene-${String(scene).padStart(2, "0")}.${extension}`;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

export interface SceneData {
  scene: number;
  title: string;
  duration: number;
  narration: string;
  visual: string;
  imagePrompt: string;
  imagePath: string;
  audioPath: string;
}

export interface VideoProject {
  title: string;
  duration: string;
  sceneCount: number;
  scenes: SceneData[];
  settings?: VideoSettings;
}

export interface ResumeProject {
  documentId: string;
  force?: boolean;
  settings?: VideoSettings;
  onProgress?: (message: string) => void;
  onStepProgress?: (progress: StepProgress) => void;
}

interface SavedStoryboard extends VideoProject {
  documentId: string;
  generatedAt: string;
}

async function loadStoryboard(documentId: string): Promise<VideoProject | null> {
  const metaPath = storyboardPath(documentId);
  try {
    const saved = JSON.parse(await fs.readFile(metaPath, "utf-8")) as SavedStoryboard;
    if (saved.documentId === documentId && Array.isArray(saved.scenes) && saved.scenes.length) {
      console.log("[RESUME] Storyboard exists");
      return {
        title: saved.title,
        duration: saved.duration,
        sceneCount: saved.sceneCount,
        scenes: saved.scenes,
        settings: saved.settings,
      };
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("[RESUME] Ignoring unreadable saved storyboard");
    }
  }
  return null;
}

async function saveStoryboard(documentId: string, project: VideoProject): Promise<void> {
  const metaPath = storyboardPath(documentId);
  await fs.mkdir(path.dirname(metaPath), { recursive: true });
  const saved: SavedStoryboard = { documentId, ...project, generatedAt: new Date().toISOString() };
  const temporaryPath = `${metaPath}.tmp`;
  await fs.writeFile(temporaryPath, JSON.stringify(saved, null, 2));
  await fs.rename(temporaryPath, metaPath);
}

function projectFromOverview(documentId: string, overview: Overview, settings: VideoSettings): VideoProject {
  const prompts = generateImagePrompts(overview, settings);
  const scenes = overview.scenes.map((scene) => {
    const imagePrompt = prompts.find((prompt) => prompt.scene === scene.scene)?.prompt ?? scene.visual;
    return {
      scene: scene.scene,
      title: overview.title,
      duration: parseDurationSeconds(scene.duration),
      narration: scene.narration,
      visual: scene.visual,
      imagePrompt,
      imagePath: `generated/${documentId}/images/${sceneFilename(scene.scene, "png")}`,
      audioPath: `generated/${documentId}/audio/${sceneFilename(scene.scene, "mp3")}`,
    };
  });
  return { title: overview.title, duration: overview.duration, sceneCount: scenes.length, scenes, settings };
}

async function reportAssetProgress(documentId: string, kind: "Images" | "Audio", scenes: SceneData[]): Promise<number | null> {
  const subdir = kind === "Images" ? "images" : "audio";
  const extension = kind === "Images" ? "png" : "mp3";
  const directory = docDir(documentId, subdir);
  const completed = await Promise.all(scenes.map((scene) => exists(path.join(directory, sceneFilename(scene.scene, extension)))));
  const completeCount = completed.filter(Boolean).length;
  if (completeCount === scenes.length) {
    console.log(`[RESUME] ${kind} complete`);
    return null;
  }
  console.log(`[RESUME] ${kind} ${completeCount}/${scenes.length} complete`);
  return scenes[completed.findIndex((complete) => !complete)]?.scene ?? null;
}

/**
 * Resumes a project from its persisted checkpoints. Every successful scene is saved to disk
 * before the next API call, so a retry after an API/network failure only creates missing assets.
 */
export async function resumePipeline(project: ResumeProject): Promise<VideoProject> {
  const { documentId, force = false } = project;
  console.log("[VIDEO] Incoming documentId:", documentId);

  if (!mongoose.Types.ObjectId.isValid(documentId)) throw new Error(`Invalid documentId: ${documentId}`);
  const document = await DocumentModel.findById(documentId);
  if (!document) throw new Error(`Document not found (requestedId: ${documentId})`);
  project.onProgress?.("✓ Reading PDF");
  project.onStepProgress?.({ step: "extracting", status: "running" });
  project.onStepProgress?.({ step: "extracting", status: "completed" });

  const dirs = ["images", "audio", "scripts", "output", "output/scene-clips", "metadata"].map((d) => docDir(documentId, d));
  await Promise.all(dirs.map((dir) => fs.mkdir(dir, { recursive: true })));

  const settings = resolveVideoSettings(project.settings);
  let videoProject = await loadStoryboard(documentId);
  const settingsChanged = JSON.stringify(videoProject?.settings ?? {}) !== JSON.stringify(settings);
  if (settingsChanged) videoProject = null;
  if (!videoProject) {
    project.onProgress?.("✓ Creating storyboard");
    project.onStepProgress?.({ step: "overview", status: "running" });
    const overview = await generateOverview(documentId, settings);
    videoProject = projectFromOverview(documentId, overview, settings);
    await saveStoryboard(documentId, videoProject);
    project.onStepProgress?.({ step: "overview", status: "completed" });
    console.log(`[VIDEO] Saved storyboard with ${videoProject.scenes.length} scenes`);
  } else {
    console.log("[RESUME] Overview exists");
  }

  project.onProgress?.("✓ Generating images");
  project.onStepProgress?.({ step: "images", status: "running", current: 0, total: videoProject.scenes.length });
  const nextImageScene = await reportAssetProgress(documentId, "Images", videoProject.scenes);
  if (nextImageScene !== null) console.log(`[RESUME] Continuing from Scene ${nextImageScene}`);
  const imageScenes = await generateSceneImages(documentId, videoProject.scenes, {
    force: force || settingsChanged,
    onProgress: (current, total) => project.onStepProgress?.({ step: "images", status: "running", current, total }),
  });
  videoProject = { ...videoProject, scenes: imageScenes };
  project.onStepProgress?.({ step: "images", status: "completed" });
  await saveStoryboard(documentId, videoProject);

  project.onProgress?.("✓ Generating narration");
  project.onStepProgress?.({ step: "audio", status: "running", current: 0, total: videoProject.scenes.length });
  const nextAudioScene = await reportAssetProgress(documentId, "Audio", videoProject.scenes);
  if (nextAudioScene !== null) console.log(`[RESUME] Continuing from Scene ${nextAudioScene}`);
  const audioScenes = await generateNarrations(documentId, videoProject.scenes, {
    force: force || settingsChanged,
    voice: settings.voice,
    onProgress: (current, total) => project.onStepProgress?.({ step: "audio", status: "running", current, total }),
  });
  videoProject = { ...videoProject, scenes: audioScenes };
  project.onStepProgress?.({ step: "audio", status: "completed" });
  await saveStoryboard(documentId, videoProject);

  const fullScript = videoProject.scenes.map((scene) => `[Scene ${scene.scene}] ${scene.narration}`).join("\n\n");
  await fs.writeFile(docDir(documentId, "scripts", "script.txt"), fullScript);

  project.onProgress?.("✓ Rendering scenes");
  project.onStepProgress?.({ step: "clips", status: "running", current: 0, total: videoProject.scenes.length });
  console.log(force ? "[VIDEO] Force rendering overview video" : "[VIDEO] Rendering overview video");
  await renderVideo(documentId, videoProject, force || settingsChanged, (current, total) => {
    project.onStepProgress?.({ step: "clips", status: "running", current, total });
  });
  project.onStepProgress?.({ step: "clips", status: "completed" });

  project.onProgress?.("✓ Merging final video");
  project.onStepProgress?.({ step: "rendering", status: "running", current: 0, total: 100 });
  project.onStepProgress?.({ step: "rendering", status: "running", current: 50, total: 100 });
  project.onStepProgress?.({ step: "rendering", status: "running", current: 100, total: 100 });
  project.onStepProgress?.({ step: "rendering", status: "completed" });

  document.overview = { title: videoProject.title, duration: videoProject.duration, sceneCount: videoProject.sceneCount, generatedAt: new Date() };
  document.storyboard = { status: "ready", scenes: videoProject.scenes };
  document.video = { status: "ready", duration: videoProject.duration, url: `generated/${documentId}/output/overview.mp4`, generatedAt: new Date() };
  await document.save();

  console.log("[VIDEO] Completed");
  project.onStepProgress?.({ step: "completed", status: "completed", message: "Video generated successfully" });
  return videoProject;
}

export async function runVideoPipeline(documentId: string, options: { force?: boolean; settings?: VideoSettings; onProgress?: (message: string) => void; onStepProgress?: (progress: StepProgress) => void } = {}): Promise<VideoProject> {
  return resumePipeline({ documentId, force: options.force, settings: options.settings, onProgress: options.onProgress, onStepProgress: options.onStepProgress });
}
