import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

const AUDIO_DIR = path.resolve(import.meta.dirname, "../..", "generated", "audio");
const GEMINI_TTS_MODEL = process.env.GEMINI_TTS_MODEL ?? "gemini-3.1-flash-tts-preview";
const GEMINI_TTS_VOICE = process.env.GEMINI_TTS_VOICE ?? "Kore";
const RETRY_COUNT = 3;
const PCM_SAMPLE_RATE = 24_000;
const PCM_BYTES_PER_SAMPLE = 2;

export interface NarrationScene {
  scene: number;
  narration: string;
}

export interface NarrationResult {
  audioPath: string;
  duration: number;
}

interface TtsProvider {
  synthesize(narration: string): Promise<{ pcm: Buffer; sampleRate: number }>;
}

class GeminiTtsProvider implements TtsProvider {
  async synthesize(narration: string): Promise<{ pcm: Buffer; sampleRate: number }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: narration }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: GEMINI_TTS_VOICE },
            },
          },
        },
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      throw new Error(`Gemini TTS returned ${response.status}: ${(await response.text()).slice(0, 500)}`);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>;
    };
    const inlineData = payload.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
    if (!inlineData?.data) throw new Error("Gemini TTS returned no audio data");

    const sampleRate = Number(inlineData.mimeType?.match(/rate=(\d+)/i)?.[1]) || PCM_SAMPLE_RATE;
    return { pcm: Buffer.from(inlineData.data, "base64"), sampleRate };
  }
}

const provider: TtsProvider = new GeminiTtsProvider();

function filenameForScene(scene: number): string {
  return `scene-${String(scene).padStart(2, "0")}.mp3`;
}

function writeMp3(pcm: Buffer, sampleRate: number, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y", "-f", "s16le", "-ar", String(sampleRate), "-ac", "1", "-i", "pipe:0",
      "-codec:a", "libmp3lame", "-q:a", "2", outputPath,
    ], { stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";

    ffmpeg.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    ffmpeg.once("error", reject);
    ffmpeg.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg failed with exit code ${code}: ${stderr.slice(-500)}`));
    });
    ffmpeg.stdin.end(pcm);
  });
}

async function synthesizeWithRetry(narration: string): Promise<{ pcm: Buffer; sampleRate: number }> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      return await provider.synthesize(narration);
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_COUNT) break;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function generateNarration(scene: NarrationScene): Promise<NarrationResult> {
  if (!scene.narration.trim()) throw new Error(`Scene ${scene.scene} has no narration`);

  await fs.mkdir(AUDIO_DIR, { recursive: true });
  const filename = filenameForScene(scene.scene);
  const outputPath = path.join(AUDIO_DIR, filename);
  const { pcm, sampleRate } = await synthesizeWithRetry(scene.narration);
  await writeMp3(pcm, sampleRate, outputPath);

  return {
    audioPath: `generated/audio/${filename}`,
    duration: Number((pcm.length / (sampleRate * PCM_BYTES_PER_SAMPLE)).toFixed(1)),
  };
}

/** Generates scene narration files sequentially and returns scenes with audioPath filled. */
export async function generateNarrations<T extends NarrationScene>(
  scenes: T[]
): Promise<Array<T & NarrationResult>> {
  const updatedScenes: Array<T & NarrationResult> = [];

  for (const [index, scene] of scenes.entries()) {
    console.log(`[TTS] Scene ${index + 1}/${scenes.length}`);
    console.log("[TTS] Generating narration");
    const narration = await generateNarration(scene);
    console.log(`[TTS] Saved ${path.basename(narration.audioPath)}`);
    updatedScenes.push({ ...scene, ...narration });
  }

  return updatedScenes;
}
