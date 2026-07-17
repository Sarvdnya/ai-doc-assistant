import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import DocumentModel from "../models/Document.model.js";
import { generateOverview } from "./overview.service.js";
import { generateImagePrompts } from "./imagePrompt.service.js";
import { generateSceneImages } from "./imageGeneration.service.js";
import { generateNarrations } from "./tts.service.js";

const GENERATED_DIR = path.resolve(import.meta.dirname, "../..", "generated");
const IMAGES_DIR = path.join(GENERATED_DIR, "images");
const SCRIPTS_DIR = path.join(GENERATED_DIR, "scripts");
const OUTPUT_DIR = path.join(GENERATED_DIR, "output");

function parseDurationSeconds(dur: string): number {
  const m = dur.match(/(\d+(?:\.\d+)?)\s*sec/);
  return m ? parseFloat(m[1]) : 8;
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
}

export async function runVideoPipeline(documentId: string): Promise<VideoProject> {
  console.log("[VIDEO] Incoming documentId:", documentId);

  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    throw new Error(`Invalid documentId: ${documentId}`);
  }

  console.log("[VIDEO] Loading document");
  const document = await DocumentModel.findById(documentId);
  if (!document) {
    throw new Error(`Document not found (requestedId: ${documentId})`);
  }

  await fs.mkdir(IMAGES_DIR, { recursive: true });
  await fs.mkdir(SCRIPTS_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  console.log("[VIDEO] Generating overview");
  const overview = await generateOverview(documentId);

  console.log("[VIDEO] Generating storyboard");
  const scenes = overview.scenes;
  console.log(`[VIDEO] Generated storyboard with ${scenes.length} scenes`);

  // Narration is generated in the single structured Ollama overview request above.
  console.log("[VIDEO] Generating narration");
  console.log(`[VIDEO] Generated narration for ${scenes.length} scenes`);

  console.log("[VIDEO] Generating image prompts");
  const prompts = generateImagePrompts(overview);

  const scenesForImages: Array<Omit<SceneData, "imagePath" | "audioPath">> = [];

  console.log("[VIDEO] Generating images");

  for (const scene of scenes) {
    const promptObj = prompts.find((p) => p.scene === scene.scene);
    const imagePrompt = promptObj?.prompt ?? scene.visual;
    scenesForImages.push({
      scene: scene.scene,
      title: overview.title,
      duration: parseDurationSeconds(scene.duration),
      narration: scene.narration,
      visual: scene.visual,
      imagePrompt,
    });
  }

  const scenesWithImages = await generateSceneImages(scenesForImages);

  console.log("[VIDEO] Generating narration audio");
  const projectScenes = await generateNarrations(scenesWithImages);

  console.log("[VIDEO] Saving files");
  const fullScript = scenes
    .map((s) => `[Scene ${s.scene}] ${s.narration}`)
    .join("\n\n");
  const scriptPath = path.join(SCRIPTS_DIR, "script.txt");
  await fs.writeFile(scriptPath, fullScript);

  console.log("[VIDEO] Saving files");
  document.overview = {
    title: overview.title,
    duration: overview.duration,
    sceneCount: scenes.length,
    generatedAt: new Date(),
  };
  document.storyboard = {
    status: "pending",
    scenes: projectScenes,
  };
  document.video = {
    status: "pending",
    duration: overview.duration,
  };
  await document.save();

  console.log("[VIDEO] Completed");

  return {
    title: overview.title,
    duration: overview.duration,
    sceneCount: scenes.length,
    scenes: projectScenes,
  };
}
