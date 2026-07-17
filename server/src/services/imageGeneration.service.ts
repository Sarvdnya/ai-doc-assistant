import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import DocumentModel from "../models/Document.model.js";

const IMAGES_DIR = path.resolve(import.meta.dirname, "../..", "generated", "images");
const POLLINATIONS_BASE_URL = "https://image.pollinations.ai/prompt";
const RETRY_COUNT = 3;
const RETRY_DELAY_MS = 2_000;

export interface SceneInput {
  scene: number;
  narration: string;
  visual: string;
  imagePrompt: string;
}

export interface SceneImageResult {
  scene: number;
  imagePath: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sceneFilename(scene: number): string {
  return `scene-${String(scene).padStart(2, "0")}.png`;
}

function promptForScene(scene: SceneInput): string {
  return scene.imagePrompt.trim() || scene.visual.trim() || scene.narration.trim();
}

async function downloadImage(prompt: string): Promise<Buffer> {
  const url = `${POLLINATIONS_BASE_URL}/${encodeURIComponent(prompt)}?width=1024&height=576&format=png`;
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      if (!response.ok) {
        throw new Error(`Pollinations returned ${response.status}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_COUNT) break;
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Generates one PNG per scene in sequence and returns the scenes with imagePath filled. */
export async function generateSceneImages<T extends SceneInput>(
  scenes: T[]
): Promise<Array<T & { imagePath: string }>> {
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  const updatedScenes: Array<T & { imagePath: string }> = [];
  for (const [index, scene] of scenes.entries()) {
    console.log(`[IMAGE] Scene ${index + 1}/${scenes.length}`);
    console.log("[IMAGE] Generating image");

    const image = await downloadImage(promptForScene(scene));
    console.log("[IMAGE] Downloaded");

    const filename = sceneFilename(scene.scene);
    await fs.writeFile(path.join(IMAGES_DIR, filename), image);
    console.log("[IMAGE] Saved");

    updatedScenes.push({
      ...scene,
      imagePath: `generated/images/${filename}`,
    });
  }

  return updatedScenes;
}

export async function generateSceneImage(scene: SceneInput): Promise<SceneImageResult> {
  const [updatedScene] = await generateSceneImages([scene]);
  return { scene: updatedScene.scene, imagePath: updatedScene.imagePath };
}

/** Regenerates the images for an already-saved storyboard. */
export async function generateAllSceneImages(documentId: string): Promise<{
  success: boolean;
  generatedImages: SceneImageResult[];
}> {
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    throw new Error(`Invalid documentId: ${documentId}`);
  }

  const document = await DocumentModel.findById(documentId);
  if (!document) throw new Error(`Document not found (requestedId: ${documentId})`);
  if (!document.storyboard?.scenes.length) {
    throw new Error("No storyboard found.");
  }

  const updatedScenes = await generateSceneImages(document.storyboard.scenes);
  document.storyboard.scenes = updatedScenes;
  document.storyboard.status = "ready";
  await document.save();

  return {
    success: true,
    generatedImages: updatedScenes.map(({ scene, imagePath }) => ({ scene, imagePath })),
  };
}
