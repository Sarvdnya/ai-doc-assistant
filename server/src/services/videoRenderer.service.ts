import { spawn } from "child_process";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const GENERATED_DIR = path.resolve(import.meta.dirname, "../..", "generated");
const FPS = 30;
const CROSSFADE_SECONDS = 0.5;

export interface RenderSceneInput {
  scene: number;
  duration: number | string;
  imagePath: string;
  audioPath?: string;
}

export interface RenderProject {
  scenes: RenderSceneInput[];
  settings?: { aspectRatio?: string; transitions?: string };
}

export interface RenderedVideo {
  videoPath: string;
  duration: number;
}

function docDir(documentId: string, ...subdirs: string[]): string {
  return path.join(GENERATED_DIR, documentId, ...subdirs);
}

function absoluteGeneratedPath(assetPath: string): string {
  return path.isAbsolute(assetPath)
    ? assetPath
    : path.resolve(import.meta.dirname, "../..", assetPath);
}

function durationSeconds(duration: number | string): number {
  if (typeof duration === "number") return duration;
  const match = duration.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

async function mediaDurationSeconds(mediaPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = spawn("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", mediaPath,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    let stderr = "";

    probe.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    probe.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    probe.once("error", reject);
    probe.once("close", (code) => {
      const duration = Number.parseFloat(output.trim());
      if (code === 0 && Number.isFinite(duration) && duration > 0) resolve(duration);
      else reject(new Error(`Could not read media duration: ${stderr.slice(-500)}`));
    });
  });
}

async function findSceneVideo(documentId: string, scene: number): Promise<string | null> {
  const filename = `scene-${String(scene).padStart(2, "0")}.mp4`;
  const candidates = [
    docDir(documentId, "video", filename),
    docDir(documentId, "output", "scene-clips", filename),
    docDir(documentId, "output", filename),
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return null;
}

async function hasAudioStream(videoPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = spawn("ffprobe", [
      "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_type",
      "-of", "default=noprint_wrappers=1:nokey=1", videoPath,
    ], { stdio: ["ignore", "pipe", "ignore"] });
    let output = "";
    probe.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    probe.once("error", () => resolve(false));
    probe.once("close", (code) => resolve(code === 0 && output.trim() === "audio"));
  });
}

async function verifyAttachedAudio(videoPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const probe = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "stream=codec_type",
      "-of", "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    probe.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    probe.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    probe.once("error", reject);
    probe.once("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed: ${stderr}`));
        return;
      }
      const types = stdout.trim().split("\n").filter(Boolean);
      if (types.length < 2 || types[0] !== "video" || types[1] !== "audio") {
        reject(new Error(`Expected Stream 0 = video, Stream 1 = audio, got: ${stdout.trim()}`));
        return;
      }
      resolve();
    });
  });
}

/** Attach narration audio to an existing scene video. */
export async function attachAudioToScene(
  videoPath: string,
  audioPath: string,
  outputPath: string,
  sceneNumber: number
): Promise<number> {
  const videoDuration = await mediaDurationSeconds(videoPath);
  const audioDuration = await mediaDurationSeconds(audioPath);
  const totalDuration = Math.max(videoDuration, audioDuration);
  const extension = Math.max(0, totalDuration - videoDuration);

  console.log(`[AUDIO] Attaching audio to Scene ${sceneNumber}`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const videoFilter = extension > 0
    ? `[0:v]tpad=stop_mode=clone:stop_duration=${extension},setpts=PTS-STARTPTS[v]`
    : `[0:v]setpts=PTS-STARTPTS[v]`;
  const audioFilter = `[1:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=duration=${totalDuration},asetpts=PTS-STARTPTS[a]`;

  const args = [
    "-y",
    "-i", videoPath,
    "-i", audioPath,
    "-filter_complex", `${videoFilter};${audioFilter}`,
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-ar", "48000", "-ac", "2",
    outputPath,
  ];
  console.log(`[FFMPEG] ffmpeg ${formatCommand(args)}`);

  await runFfmpeg(args);

  await verifyAttachedAudio(outputPath);

  console.log(`[AUDIO] Scene ${sceneNumber} created`);
  console.log(outputPath);

  return totalDuration;
}

function formatCommand(args: string[]): string {
  return args.map(a => a.includes(" ") ? `"${a}"` : a).join(" ");
}

function runFfmpeg(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";

    process.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    process.once("error", reject);
    process.once("close", (code) => {
      if (code === 0) resolve(stderr);
      else reject(new Error(stderr));
    });
  });
}

/** Muxes existing scene video and narration without regenerating source assets. */
export async function renderScene(
  documentId: string,
  scene: RenderSceneInput,
  _index: number,
  _totalScenes: number,
  settings?: RenderProject["settings"]
): Promise<{ clipPath: string; duration: number }> {
  const portrait = settings?.aspectRatio === "9:16";
  const square = settings?.aspectRatio === "1:1";
  const width = portrait ? 1080 : square ? 1080 : 1920;
  const height = portrait ? 1920 : square ? 1080 : 1080;
  const canvas = `${width}:${height}`;
  const transitionSeconds = settings?.transitions?.toLowerCase() === "none" ? 0 : CROSSFADE_SECONDS;
  const clipsDir = docDir(documentId, "output", "scene-clips");
  const sourceVideoPath = await findSceneVideo(documentId, scene.scene);

  let narrationPath: string | null = null;
  let narrationDuration = 0;
  if (scene.audioPath) {
    const candidate = absoluteGeneratedPath(scene.audioPath);
    try {
      await fs.access(candidate);
      narrationPath = candidate;
      narrationDuration = await mediaDurationSeconds(candidate);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        console.warn(`[AUDIO] Scene ${scene.scene} audio missing at ${candidate}`);
      } else {
        throw error;
      }
    }
  } else {
    console.warn(`[AUDIO] Scene ${scene.scene} audio missing`);
  }

  const storyboardDuration = durationSeconds(scene.duration);
  if (!Number.isFinite(storyboardDuration) || storyboardDuration <= 0) {
    throw new Error(`Scene ${scene.scene} has an invalid duration`);
  }

  const filename = `scene-${String(scene.scene).padStart(2, "0")}-with-audio.mp4`;
  const clipPath = path.join(clipsDir, filename);
  await fs.mkdir(clipsDir, { recursive: true });

  console.log("----------------------------------------");
  console.log(`Scene: ${scene.scene}`);
  console.log(`Source video:\n${sourceVideoPath ?? "(none — using image)"}`);
  console.log(`Narration:\n${narrationPath ?? "(none)"}`);
  console.log(`Output:\n${clipPath}`);
  console.log("----------------------------------------");

  if (sourceVideoPath && narrationPath) {
    console.log(`[SCENE] Attaching audio to scene ${scene.scene} from ${sourceVideoPath}`);
    const duration = await attachAudioToScene(sourceVideoPath, narrationPath, clipPath, scene.scene);
    console.log(`[SCENE] Saved ${filename}`);
    return { clipPath, duration };
  }

  const videoDuration = sourceVideoPath
    ? await mediaDurationSeconds(sourceVideoPath)
    : storyboardDuration;
  const duration = Math.max(videoDuration, narrationDuration, storyboardDuration);
  const extension = Math.max(0, duration - videoDuration);
  const videoFilter = sourceVideoPath
    ? `[0:v]fps=${FPS},scale=${canvas}:force_original_aspect_ratio=decrease,pad=${canvas}:(ow-iw)/2:(oh-ih)/2,tpad=stop_mode=clone:stop_duration=${extension},trim=duration=${duration},setpts=PTS-STARTPTS[video]`
    : `[0:v]scale=${canvas}:force_original_aspect_ratio=decrease,pad=${canvas}:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0005,1.08)':d=1:s=${width}x${height}:fps=${FPS},fade=t=in:st=0:d=${transitionSeconds},fade=t=out:st=${Math.max(0, duration - transitionSeconds)}:d=${transitionSeconds},trim=duration=${duration},setpts=PTS-STARTPTS[video]`;
  const audioFilter = narrationPath
    ? `[1:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=duration=${duration},asetpts=PTS-STARTPTS[audio]`
    : `anullsrc=r=48000:cl=stereo,atrim=duration=${duration}[audio]`;

  console.log(`[SCENE] Creating ${filename} from image`);
  const sourceArgs = sourceVideoPath
    ? ["-i", sourceVideoPath]
    : ["-loop", "1", "-framerate", String(FPS), "-t", String(duration), "-i", absoluteGeneratedPath(scene.imagePath)];

  const renderArgs = narrationPath
    ? [
        "-y", ...sourceArgs,
        "-i", narrationPath,
        "-filter_complex", `${videoFilter};${audioFilter}`,
        "-map", "[video]", "-map", "[audio]",
        "-r", String(FPS),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-ar", "48000", "-ac", "2", clipPath,
      ]
    : [
        "-y", ...sourceArgs,
        "-filter_complex", `${videoFilter};${audioFilter}`,
        "-map", "[video]", "-map", "[audio]",
        "-r", String(FPS),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-ar", "48000", "-ac", "2", clipPath,
      ];
  console.log(`[FFMPEG] ffmpeg ${formatCommand(renderArgs)}`);

  try {
    await runFfmpeg(renderArgs);
    console.log(`[AUDIO] Scene ${scene.scene} created`);
    console.log(clipPath);
  } catch (error) {
    const stderr = error instanceof Error ? error.message : String(error);
    console.log(`[FFMPEG] Scene ${scene.scene} FAILED`);
    console.log(stderr);
    throw error;
  }

  if (!fsSync.existsSync(clipPath)) {
    throw new Error(`Scene clip was not created: ${clipPath}`);
  }

  if (narrationPath) {
    if (!await hasAudioStream(clipPath)) {
      throw new Error(`Scene video exported without audio stream: ${clipPath}`);
    }
  }

  console.log(`[SCENE] Saved ${filename}`);

  return { clipPath, duration };
}

/** Concatenates already-muxed scene clips into the final MP4. */
export async function combineScenes(documentId: string, clips: string[], durations: number[]): Promise<RenderedVideo> {
  if (!clips.length) throw new Error("No scene clips to combine");

  const outputDir = docDir(documentId, "output");
  const videoPath = path.join(outputDir, "overview.mp4");
  console.log("[VIDEO] Starting concatenation");
  console.log("[VIDEO] Scene clips to concatenate:");
  for (const clip of clips) {
    console.log(`  ${clip}`);
    if (!fsSync.existsSync(clip)) {
      throw new Error(`Missing clip:\n${clip}`);
    }
  }
  console.log(`[VIDEO] Concatenating ${clips.length} scenes`);

  if (clips.length === 1) {
    await runFfmpeg([
      "-y", "-i", clips[0],
      "-c:v", "libx264", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", videoPath,
    ]);
    return { videoPath: `generated/${documentId}/output/overview.mp4`, duration: durations[0] };
  }

  const inputs = clips.map((_clip, index) => `[${index}:v][${index}:a]`).join("");
  const filter = `${inputs}concat=n=${clips.length}:v=1:a=1[video][audio]`;

  await runFfmpeg([
    "-y",
    ...clips.flatMap((clip) => ["-i", clip]),
    "-filter_complex", filter,
    "-map", "[video]", "-map", "[audio]",
    "-r", String(FPS),
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", videoPath,
  ]);

  return { videoPath: `generated/${documentId}/output/overview.mp4`, duration: Number(durations.reduce((total, duration) => total + duration, 0).toFixed(1)) };
}

/** Builds the final MP4 exclusively from existing scene videos and narration files. */
export async function renderVideo(documentId: string, project: RenderProject, force = false): Promise<RenderedVideo> {
  if (!project.scenes.length) throw new Error("Project has no scenes to render");

  console.log("[VIDEO] Using NEW renderer");
  console.log("[VIDEO] Scene renderer started");
  const outputDir = docDir(documentId, "output");
  await fs.mkdir(outputDir, { recursive: true });

  const clips: string[] = [];
  const durations: number[] = [];

  for (const [index, scene] of project.scenes.entries()) {
    const renderedScene = await renderScene(documentId, scene, index, project.scenes.length, project.settings);
    clips.push(renderedScene.clipPath);
    durations.push(renderedScene.duration);
  }

  const outputPath = path.join(outputDir, "overview.mp4");
  if (!force) {
    try {
      await fs.access(outputPath);
      if (await hasAudioStream(outputPath)) {
        console.log("[VIDEO] Overview video already exists");
        console.log("[VIDEO] Skipping concatenation");
        return { videoPath: `generated/${documentId}/output/overview.mp4`, duration: Number(durations.reduce((total, duration) => total + duration, 0).toFixed(1)) };
      }
      console.log("[VIDEO] Existing overview video has no audio; rebuilding");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  const result = await combineScenes(documentId, clips, durations);
  console.log("[VIDEO] Export complete");
  return result;
}
