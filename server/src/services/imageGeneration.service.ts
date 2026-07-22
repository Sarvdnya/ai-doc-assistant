import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import DocumentModel from "../models/Document.model.js";

const GENERATED_DIR = path.resolve(import.meta.dirname, "../..", "generated");
const DEFAULT_CLOUDFLARE_MODEL = "@cf/black-forest-labs/flux-1-schnell";
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

function detectExt(buffer: Buffer): string {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "png";
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return "gif";
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return "webp";
  return "png";
}

function sceneFilename(scene: number, ext: string): string {
  return `scene-${String(scene).padStart(2, "0")}.${ext}`;
}

function imagesDir(documentId: string): string {
  return path.join(GENERATED_DIR, documentId, "images");
}

function promptForScene(scene: SceneInput): string {
  return scene.imagePrompt.trim() || scene.visual.trim() || scene.narration.trim();
}

function getCloudflareModel(): string {
  return process.env.CLOUDFLARE_MODEL ?? DEFAULT_CLOUDFLARE_MODEL;
}

async function generateImage(prompt: string): Promise<{ buffer: Buffer; ext: string }> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;
      const model = getCloudflareModel();

      if (!accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID missing");
      if (!apiToken) throw new Error("CLOUDFLARE_API_TOKEN missing");

      const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
      const payload = { prompt, height: 1280, width: 1024 };

      console.log("Model:", model);
      console.log("Request Payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const bodyText = await response.text();
        let bodyJson: object | string = bodyText;
        try { bodyJson = JSON.parse(bodyText); } catch { /* use raw text */ }
        const err = new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
        (err as any).status = response.status;
        (err as any).body = bodyJson;
        (err as any).headers = Object.fromEntries(response.headers.entries());
        throw err;
      }

      const bodyText = await response.text();

      let json: any;
      try {
        json = JSON.parse(bodyText);
      } catch {
        const err = new Error("Cloudflare returned non-JSON response");
        (err as any).status = response.status;
        (err as any).body = bodyText;
        throw err;
      }

      console.log("JSON response keys:", Object.keys(json));

      if (json.result) {
        console.log("result keys:", Object.keys(json.result));
      }

      if (json.result?.image) {
        console.log("image property detected: result.image (base64)");
        const decoded = Buffer.from(json.result.image, "base64");
        console.log("✓ Base64 decoded");
        const ext = detectExt(decoded);
        return { buffer: decoded, ext };
      }

      if (json.result?.url || (Array.isArray(json.result) && json.result[0]?.url)) {
        const imageUrl = json.result?.url || json.result[0]?.url;
        console.log("image property detected: result.url");
        const imgResp = await fetch(imageUrl);
        if (!imgResp.ok) throw new Error(`Failed to download image from URL: ${imgResp.status}`);
        const buffer = Buffer.from(await imgResp.arrayBuffer());
        console.log("✓ Image downloaded");
        const ext = detectExt(buffer);
        return { buffer, ext };
      }

      const err = new Error("Cloudflare returned no image data");
      (err as any).status = response.status;
      (err as any).body = json;
      throw err;
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
  documentId: string,
  scenes: T[],
  options: { force?: boolean; onProgress?: (current: number, total: number) => void } = {}
): Promise<Array<T & { imagePath: string }>> {
  const dir = imagesDir(documentId);
  await fs.mkdir(dir, { recursive: true });
  console.log("✓ Cloudflare Connected");
  console.log(`✓ Model: ${getCloudflareModel()}`);

  const updatedScenes: Array<T & { imagePath: string }> = [];
  for (const [index, scene] of scenes.entries()) {
    options.onProgress?.(index + 1, scenes.length);
    const scenePrefix = `scene-${String(scene.scene).padStart(2, "0")}`;
    console.log(`[IMAGE] Scene ${index + 1}/${scenes.length}`);
    if (!options.force) {
      let found = false;
      let foundFile = "";
      for (const ext of ["png", "jpg", "jpeg", "webp", "gif"]) {
        const p = path.join(dir, `${scenePrefix}.${ext}`);
        try {
          await fs.access(p);
          found = true;
          foundFile = `${scenePrefix}.${ext}`;
          break;
        } catch { /* not this ext */ }
      }
      if (found) {
        console.log(`[IMAGE] Scene ${scene.scene} already exists`);
        console.log("[IMAGE] Skipping");
        updatedScenes.push({ ...scene, imagePath: `generated/${documentId}/images/${foundFile}` });
        continue;
      }
    }
    console.log("[IMAGE] Generating image");

    let result: { buffer: Buffer; ext: string };
    try {
      result = await generateImage(promptForScene(scene));
    } catch (error: any) {
      console.error("[IMAGE]");
      console.error("  status:", error.status ?? "N/A");
      console.error("  body:", JSON.stringify(error.body ?? {}, null, 2));
      console.error("  headers:", JSON.stringify(error.headers ?? {}, null, 2));
      console.error("  stack:", error.stack);
      throw error;
    }

    const actualFilename = sceneFilename(scene.scene, result.ext);
    const actualPath = path.join(dir, actualFilename);
    await fs.writeFile(actualPath, result.buffer);
    console.log(`✓ Image saved`);
    console.log(`✓ Scene ${scene.scene} generated`);
    console.log(`  saved: generated/${documentId}/images/${actualFilename}`);

    updatedScenes.push({
      ...scene,
      imagePath: `generated/${documentId}/images/${actualFilename}`,
    });
  }

  return updatedScenes;
}

export async function generateSceneImage(documentId: string, scene: SceneInput): Promise<SceneImageResult> {
  const [updatedScene] = await generateSceneImages(documentId, [scene]);
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

  const updatedScenes = await generateSceneImages(documentId, document.storyboard.scenes);
  document.storyboard.scenes = updatedScenes;
  document.storyboard.status = "ready";
  await document.save();

  return {
    success: true,
    generatedImages: updatedScenes.map(({ scene, imagePath }) => ({ scene, imagePath })),
  };
}
