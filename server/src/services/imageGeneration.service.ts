import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const GENERATED_DIR = path.resolve(import.meta.dirname, "../..", "generated");
const IMAGES_DIR = path.join(GENERATED_DIR, "images");
const METADATA_DIR = path.join(GENERATED_DIR, "metadata");

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

const STYLE_PREFIX =
  "Flat 3D illustration, minimal, clean, white background, soft shadows, blue gradient, educational infographic, high quality, isometric, vector style";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function buildFallbackSvg(sceneNum: number, label: string): string {
  const text = label.length > 80 ? label.slice(0, 77) + "..." : label;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="#f0f4ff"/>
  <rect x="160" y="240" width="1600" height="600" rx="24" fill="#ffffff" stroke="#2563eb" stroke-width="4"/>
  <circle cx="960" cy="420" r="80" fill="#dbeafe" stroke="#2563eb" stroke-width="3"/>
  <text x="960" y="540" font-family="system-ui, sans-serif" font-size="48" fill="#1e3a8a" text-anchor="middle" font-weight="bold">Scene ${sceneNum}</text>
  <text x="960" y="600" font-family="system-ui, sans-serif" font-size="28" fill="#475569" text-anchor="middle">${text}</text>
</svg>`;
}

export interface SceneInput {
  scene: number;
  title: string;
  narration: string;
  visual: string;
  imagePrompt: string;
}

export interface SceneImageResult {
  scene: number;
  imagePath: string;
  generated: boolean;
  error?: string;
}

function buildFinalPrompt(imagePrompt: string): string {
  return `${STYLE_PREFIX}, ${imagePrompt}`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function generateSceneImage(scene: SceneInput): Promise<SceneImageResult> {
  const padded = pad(scene.scene);
  const filename = `scene-${padded}.png`;
  const imagePath = `generated/images/${filename}`;
  const absolutePath = path.join(IMAGES_DIR, filename);

  console.log(`[IMAGE] Scene ${scene.scene}`);
  console.log(`[IMAGE] Downloading image`);

  const finalPrompt = buildFinalPrompt(scene.imagePrompt);
  const url = `${POLLINATIONS_BASE}/${encodeURIComponent(finalPrompt)}?width=1024&height=576&nologo=true`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Pollinations returned ${response.status}: ${body.slice(0, 200)}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(absolutePath, buffer);

    console.log(`[IMAGE] Saved generated/images/${filename}`);
    return { scene: scene.scene, imagePath, generated: true };

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[IMAGE] Download failed: ${msg}`);

    const svg = buildFallbackSvg(scene.scene, scene.imagePrompt);
    const svgPath = absolutePath.replace(/\.png$/, ".svg");
    await fs.writeFile(svgPath, svg);

    const svgImagePath = imagePath.replace(/\.png$/, ".svg");
    console.log(`[IMAGE] SVG fallback for ${svgImagePath}`);
    return { scene: scene.scene, imagePath: svgImagePath, generated: false, error: msg };
  }
}

export async function generateAllSceneImages(documentId: string): Promise<{
  success: boolean;
  generatedImages: SceneImageResult[];
}> {
  const metadataPath = path.join(METADATA_DIR, "project.json");
  if (!fsSync.existsSync(metadataPath)) {
    throw new Error("No project found. Run POST /api/video/generate first.");
  }

  await fs.mkdir(IMAGES_DIR, { recursive: true });

  const raw = await fs.readFile(metadataPath, "utf-8");
  const project = JSON.parse(raw);

  const scenes: SceneInput[] = project.scenes.map((s: any) => ({
    scene: s.scene,
    title: s.title,
    narration: s.narration,
    visual: s.visual,
    imagePrompt: s.imagePrompt,
  }));

  const results: SceneImageResult[] = [];

  for (const scene of scenes) {
    const result = await generateSceneImage(scene);
    results.push(result);
    await sleep(1500);
  }

  project.scenes = project.scenes.map((s: any) => {
    const result = results.find((r) => r.scene === s.scene);
    if (result) {
      s.imagePath = result.imagePath;
      s.imageGenerated = result.generated;
    }
    return s;
  });

  await fs.writeFile(metadataPath, JSON.stringify(project, null, 2));

  return { success: true, generatedImages: results };
}
