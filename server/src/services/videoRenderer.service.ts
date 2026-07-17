import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

const GENERATED_DIR = path.resolve(import.meta.dirname, "../..", "generated");
const OUTPUT_DIR = path.join(GENERATED_DIR, "output");
const CLIPS_DIR = path.join(OUTPUT_DIR, "scene-clips");
const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const CROSSFADE_SECONDS = 0.5;

export interface RenderSceneInput {
  scene: number;
  duration: number | string;
  imagePath: string;
}

export interface RenderProject {
  scenes: RenderSceneInput[];
}

export interface RenderedVideo {
  videoPath: string;
  duration: number;
}

function durationSeconds(duration: number | string): number {
  if (typeof duration === "number") return duration;
  const match = duration.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function absoluteImagePath(imagePath: string): string {
  return path.isAbsolute(imagePath)
    ? imagePath
    : path.resolve(import.meta.dirname, "../..", imagePath);
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";

    process.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    process.once("error", reject);
    process.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg failed with exit code ${code}: ${stderr.slice(-1_000)}`));
    });
  });
}

/** Renders one still image as a 1080p animated, image-only MP4 clip. */
export async function renderScene(
  scene: RenderSceneInput,
  index: number,
  totalScenes: number
): Promise<string> {
  const duration = durationSeconds(scene.duration);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Scene ${scene.scene} has an invalid duration`);
  }

  const imagePath = absoluteImagePath(scene.imagePath);
  await fs.access(imagePath);

  const clipPath = path.join(CLIPS_DIR, `scene-${String(scene.scene).padStart(2, "0")}.mp4`);
  const fadeOutStart = Math.max(0, duration - CROSSFADE_SECONDS);
  const filter = [
    "[0:v]split=2[backgroundSource][foregroundSource]",
    `[backgroundSource]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},boxblur=20:10[background]`,
    `[foregroundSource]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease[foreground]`,
    `[background][foreground]overlay=(W-w)/2:(H-h)/2,zoompan=z='min(zoom+0.0005,1.08)':d=1:s=${WIDTH}x${HEIGHT}:fps=${FPS},fade=t=in:st=0:d=${CROSSFADE_SECONDS},fade=t=out:st=${fadeOutStart}:d=${CROSSFADE_SECONDS},format=yuv420p[video]`,
  ].join(";");

  console.log(`[VIDEO] Rendering Scene ${index + 1}/${totalScenes}`);
  await runFfmpeg([
    "-y", "-loop", "1", "-framerate", String(FPS), "-t", String(duration), "-i", imagePath,
    "-filter_complex", filter,
    "-map", "[video]",
    "-r", String(FPS),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", clipPath,
  ]);

  return clipPath;
}

/** Combines rendered clips with 0.5-second visual crossfades and no audio track. */
export async function combineScenes(clips: string[], durations: number[]): Promise<RenderedVideo> {
  if (!clips.length) throw new Error("No scene clips to combine");

  const videoPath = path.join(OUTPUT_DIR, "overview.mp4");
  console.log("[VIDEO] Combining clips");

  if (clips.length === 1) {
    await runFfmpeg([
      "-y", "-i", clips[0], "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", videoPath,
    ]);
    return { videoPath: "generated/output/overview.mp4", duration: durations[0] };
  }

  const filters: string[] = [];
  let previous = "[0:v]";
  let elapsed = durations[0];
  for (let index = 1; index < clips.length; index += 1) {
    const output = index === clips.length - 1 ? "[video]" : `[transition${index}]`;
    const offset = elapsed - CROSSFADE_SECONDS;
    filters.push(`${previous}[${index}:v]xfade=transition=fade:duration=${CROSSFADE_SECONDS}:offset=${offset}${output}`);
    previous = output;
    elapsed += durations[index] - CROSSFADE_SECONDS;
  }

  await runFfmpeg([
    "-y",
    ...clips.flatMap((clip) => ["-i", clip]),
    "-filter_complex", filters.join(";"),
    "-map", "[video]",
    "-r", String(FPS),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", videoPath,
  ]);

  return { videoPath: "generated/output/overview.mp4", duration: Number(elapsed.toFixed(1)) };
}

/** Renders a slideshow from scene images. Narration audio is intentionally not included. */
export async function renderVideo(project: RenderProject): Promise<RenderedVideo> {
  if (!project.scenes.length) throw new Error("Project has no scenes to render");

  await fs.mkdir(CLIPS_DIR, { recursive: true });
  const durations = project.scenes.map((scene) => durationSeconds(scene.duration));
  const clips: string[] = [];

  try {
    for (const [index, scene] of project.scenes.entries()) {
      clips.push(await renderScene(scene, index, project.scenes.length));
    }

    const result = await combineScenes(clips, durations);
    console.log(`[VIDEO] Video exported ${result.videoPath}`);
    return result;
  } finally {
    await Promise.all(clips.map((clip) => fs.unlink(clip).catch(() => undefined)));
  }
}
