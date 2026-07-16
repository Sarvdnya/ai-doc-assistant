import { execSync } from "child_process";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const GENERATED_DIR = path.resolve(import.meta.dirname, "../..", "generated");
const OUTPUT_DIR = path.join(GENERATED_DIR, "output");

interface SceneMeta {
  scene: number;
  duration: string;
  narration: string;
  image: string;
  script: string;
}

interface Metadata {
  title: string;
  totalDuration: string;
  totalScenes: number;
  scenes: SceneMeta[];
  generatedAt: string;
}

function parseDuration(dur: string): number {
  const m = dur.match(/(\d+(?:\.\d+)?)\s*sec/);
  return m ? parseFloat(m[1]) : 5;
}

function wrapText(text: string, maxWidth: number): string {
  if (text.length <= maxWidth) return text;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxWidth) {
      lines.push(line.trim());
      line = word;
    } else {
      line += (line ? " " : "") + word;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join("\n");
}

export async function renderVideo(documentId: string): Promise<string> {
  const metadataPath = path.join(GENERATED_DIR, "metadata", `${documentId}.json`);
  if (!fsSync.existsSync(metadataPath)) {
    throw new Error(`Metadata not found for document ${documentId}. Run video generation first.`);
  }

  const raw = await fs.readFile(metadataPath, "utf-8");
  const meta: Metadata = JSON.parse(raw);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const CROSSFADE = 0.5;
  const FPS = 30;
  const RES = "1920x1080";
  const ZOOM_MAX = 1.08;

  const inputs: string[] = [];
  const filterParts: string[] = [];

  for (let i = 0; i < meta.scenes.length; i++) {
    const s = meta.scenes[i];
    const dur = parseDuration(s.duration);

    const imgPath = path.resolve(GENERATED_DIR, s.image);
    if (!fsSync.existsSync(imgPath)) {
      throw new Error(`Missing image: ${imgPath}`);
    }

    const scriptPath = path.resolve(GENERATED_DIR, s.script);
    if (!fsSync.existsSync(scriptPath)) {
      throw new Error(`Missing script: ${scriptPath}`);
    }

    const narration = await fs.readFile(scriptPath, "utf-8");
    const wrapped = wrapText(narration.trim(), 60).replace(/'/g, "'\\''");
    const textFilter = `drawtext=text='${wrapped}':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=h-text_h-80:box=1:boxcolor=black@0.5:boxborderw=12:line_spacing=8:text_align=T`;

    const frames = Math.round(dur * FPS);
    const zoompan = `zoompan=z='min(zoom+${ZOOM_MAX-1}/${frames},${ZOOM_MAX})':d=${frames}:s=${RES},fps=${FPS}`;

    inputs.push("-loop", "1", "-t", String(dur), "-i", imgPath);
    filterParts.push(`[${i}:v]${zoompan},${textFilter},setpts=PTS-STARTPTS[v${i}]`);
  }

  let graph = filterParts.join(";\n") + ";\n";
  let prev = "v0";

  for (let i = 1; i < meta.scenes.length; i++) {
    let offset = 0;
    for (let j = 0; j < i; j++) offset += parseDuration(meta.scenes[j].duration);
    offset -= i * CROSSFADE;

    const label = i === meta.scenes.length - 1 ? "[vout]" : `[xf${i}]`;
    graph += `${prev}[v${i}]xfade=transition=fade:duration=${CROSSFADE}:offset=${offset}${label}`;
    if (i < meta.scenes.length - 1) graph += ";\n";
    prev = label;
  }

  const outputPath = path.join(OUTPUT_DIR, "video.mp4");

  const args = [
    "ffmpeg", "-y",
    ...inputs,
    "-filter_complex", graph,
    "-map", meta.scenes.length > 1 ? "[vout]" : "[v0]",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-preset", "medium",
    "-crf", "23",
    outputPath,
  ];

  console.log(`[VIDEO-RENDER] Rendering ${meta.scenes.length} scenes...`);
  execSync(args.join(" "), { stdio: "pipe", timeout: 300000 });
  console.log(`[VIDEO-RENDER] Done: ${outputPath}`);

  return outputPath;
}
