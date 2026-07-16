import fs from "fs/promises";
import path from "path";
import { generateOverview } from "./overview.service.js";
import { generateImagePrompts } from "./imagePrompt.service.js";

const GENERATED_DIR = path.resolve(import.meta.dirname, "../..", "generated");
const IMAGES_DIR = path.join(GENERATED_DIR, "images");
const SCRIPTS_DIR = path.join(GENERATED_DIR, "scripts");
const METADATA_DIR = path.join(GENERATED_DIR, "metadata");
const OUTPUT_DIR = path.join(GENERATED_DIR, "output");

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

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
}

export interface VideoProject {
  title: string;
  sceneCount: number;
  projectPath: string;
  metadataPath: string;
  scriptPath: string;
  imagePlaceholders: string[];
  scenes: SceneData[];
}

export async function runVideoPipeline(documentId: string): Promise<VideoProject> {
  console.log("[VIDEO] Incoming documentId:", documentId);
  console.log("[VIDEO] Looking up document...");

  await fs.mkdir(IMAGES_DIR, { recursive: true });
  await fs.mkdir(SCRIPTS_DIR, { recursive: true });
  await fs.mkdir(METADATA_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  console.log("[VIDEO] Generating overview");
  const overview = await generateOverview(documentId);

  console.log("[VIDEO] Generating scenes");
  const scenes = overview.scenes;

  console.log("[VIDEO] Generating image prompts");
  const prompts = generateImagePrompts(overview);

  const scenePlaceholders: string[] = [];
  const projectScenes: Array<{
    scene: number;
    title: string;
    duration: number;
    narration: string;
    visual: string;
    imagePrompt: string;
    imagePath: string;
  }> = [];

  console.log("[VIDEO] Preparing image placeholders");

  for (const scene of scenes) {
    const promptObj = prompts.find((p) => p.scene === scene.scene);
    const imagePrompt = promptObj?.prompt ?? scene.visual;
    const padded = pad(scene.scene);
    const imagePath = `generated/images/scene-${padded}.png`;
    const sceneFilePath = path.join(IMAGES_DIR, `scene-${padded}.json`);

    const sceneData = {
      scene: scene.scene,
      title: overview.title,
      duration: parseDurationSeconds(scene.duration),
      narration: scene.narration,
      visual: scene.visual,
      imagePrompt,
      imagePath,
    };

    await fs.writeFile(sceneFilePath, JSON.stringify(sceneData, null, 2));
    scenePlaceholders.push(imagePath);
    projectScenes.push(sceneData);
  }

  console.log("[VIDEO] Creating script");
  const fullScript = scenes
    .map((s) => `[Scene ${s.scene}] ${s.narration}`)
    .join("\n\n");
  const scriptPath = path.join(SCRIPTS_DIR, "script.txt");
  await fs.writeFile(scriptPath, fullScript);

  console.log("[VIDEO] Saving project");
  const project = {
    title: overview.title,
    duration: overview.duration,
    sceneCount: scenes.length,
    scenes: projectScenes,
    generatedAt: new Date().toISOString(),
  };
  const metadataPath = path.join(METADATA_DIR, "project.json");
  await fs.writeFile(metadataPath, JSON.stringify(project, null, 2));

  console.log("[VIDEO] Done");

  return {
    title: overview.title,
    sceneCount: scenes.length,
    projectPath: GENERATED_DIR,
    metadataPath,
    scriptPath,
    imagePlaceholders: scenePlaceholders,
    scenes: projectScenes,
  };
}
