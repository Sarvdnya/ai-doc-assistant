import { generateText } from "./llm.service.js";

export interface VideoSettings {
  duration?: string;
  sceneCount?: number;
  imageStyle?: string;
  voice?: string;
  narrationStyle?: string;
  audience?: string;
  language?: string;
  subtitles?: boolean;
  backgroundMusic?: boolean;
  transitions?: string;
  aspectRatio?: string;
}

export interface DirectorResponse {
  reply: string;
  settings: VideoSettings;
}

export const DEFAULT_VIDEO_SETTINGS: Required<VideoSettings> = {
  duration: "90 seconds",
  sceneCount: 8,
  imageStyle: "Educational Illustration",
  voice: "Female",
  narrationStyle: "Professional",
  audience: "College Students",
  language: "English",
  subtitles: false,
  backgroundMusic: false,
  transitions: "Fade",
  aspectRatio: "16:9",
};

const SETTING_KEYS = Object.keys(DEFAULT_VIDEO_SETTINGS) as Array<keyof VideoSettings>;

export function resolveVideoSettings(settings?: VideoSettings | null): Required<VideoSettings> {
  return { ...DEFAULT_VIDEO_SETTINGS, ...(settings ?? {}) };
}

function sanitizeSettings(settings: unknown): VideoSettings {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return {};
  const candidate = settings as Record<string, unknown>;
  const sanitized: VideoSettings = {};
  for (const key of SETTING_KEYS) {
    const value = candidate[key];
    if (value === undefined) continue;
    if (key === "sceneCount" && typeof value === "number" && Number.isFinite(value)) sanitized.sceneCount = Math.max(1, Math.round(value));
    else if (key === "subtitles" && typeof value === "boolean") sanitized.subtitles = value;
    else if (key === "backgroundMusic" && typeof value === "boolean") sanitized.backgroundMusic = value;
    else if (typeof value === "string") {
      if (key === "duration") sanitized.duration = value.trim();
      else if (key === "imageStyle") sanitized.imageStyle = value.trim();
      else if (key === "voice") sanitized.voice = value.trim();
      else if (key === "narrationStyle") sanitized.narrationStyle = value.trim();
      else if (key === "audience") sanitized.audience = value.trim();
      else if (key === "language") sanitized.language = value.trim();
      else if (key === "transitions") sanitized.transitions = value.trim();
      else if (key === "aspectRatio") sanitized.aspectRatio = value.trim();
    }
  }
  return sanitized;
}

function settingsToText(settings: VideoSettings): string {
  return Object.entries(settings)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join("\n");
}

export async function processDirectorMessage(
  message: string
): Promise<DirectorResponse> {
  const systemPrompt = `You are an AI video production instruction parser, not a chatbot. Identify only video generation setting changes from user requests.

Rules:
- Do not explain, answer questions, or hold a conversation.
- Otherwise, return ONLY the settings the user explicitly mentions. The browser preserves every other setting.
- Return valid JSON only, with two fields: "reply" (a maximum five-word production status) and "settings" (the changed settings object).
- All keys in settings must match the supported settings format exactly.
- sceneCount must be a number.
- subtitles and backgroundMusic must be booleans.
- Do not add keys that aren't in the current settings list.

Example response:
{
  "reply": "I've updated the duration to 2 minutes.",
  "settings": {
    "duration": "2 minutes",
    "sceneCount": 8,
    "imageStyle": "Educational Illustration",
    ...
  }
}`;

  const responseText = await generateText(
    `User message: "${message}"\n\nReturn ONLY valid JSON with "reply" and "settings" fields.`,
    systemPrompt
  );

  let parsed: { reply: string; settings: VideoSettings };

  try {
    const start = responseText.indexOf("{");
    const end = responseText.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON found");
    parsed = JSON.parse(responseText.slice(start, end + 1));
  } catch (error) {
    throw new Error(`Failed to parse director response: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    reply: parsed.reply,
    settings: sanitizeSettings(parsed.settings),
  };
}
