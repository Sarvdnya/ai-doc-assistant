import { fetchWithDiagnostics } from "./fetch.service";

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

export interface DirectorGenerationJob {
  success: boolean;
  status: "running" | "completed" | "failed";
  progress: string[];
  result?: { title: string; duration: string; sceneCount: number };
  error?: string;
}

export const DEFAULT_VIDEO_SETTINGS: Required<VideoSettings> = {
  duration: "90 seconds", sceneCount: 8, imageStyle: "Educational Illustration",
  voice: "Female", narrationStyle: "Professional", audience: "College Students",
  language: "English", subtitles: false, backgroundMusic: false,
  transitions: "Fade", aspectRatio: "16:9",
};

const SETTINGS_STORAGE_KEY = "videoGenerationSettings";

export function loadVideoGenerationSettings(): Required<VideoSettings> {
  if (typeof window === "undefined") return DEFAULT_VIDEO_SETTINGS;
  try {
    const stored = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}") as VideoSettings;
    return { ...DEFAULT_VIDEO_SETTINGS, ...stored };
  } catch {
    return DEFAULT_VIDEO_SETTINGS;
  }
}

export function saveVideoGenerationSettings(settings: VideoSettings): Required<VideoSettings> {
  const merged = { ...DEFAULT_VIDEO_SETTINGS, ...settings };
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function sendDirectorMessage(
  message: string
): Promise<DirectorResponse> {
  const url = `${API_BASE_URL}/api/video/director`;

  const response = await fetchWithDiagnostics(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = (await response.json()) as DirectorResponse;

  if (!response.ok || !data.reply || !data.settings) {
    throw new Error("Director request failed");
  }

  return data;
}

export async function startDirectorVideoGeneration(
  documentId: string,
  settings: VideoSettings,
  action: "full" | "images" | "narration" | "render" = "full"
): Promise<string> {
  const response = await fetchWithDiagnostics(`${API_BASE_URL}/api/video/director/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId, settings, action }),
  });
  const data = (await response.json()) as { jobId?: string; message?: string };
  if (!response.ok || !data.jobId) throw new Error(data.message ?? "Unable to start video generation.");
  return data.jobId;
}

export async function getDirectorVideoGenerationJob(jobId: string): Promise<DirectorGenerationJob> {
  const response = await fetchWithDiagnostics(`${API_BASE_URL}/api/video/director/jobs/${jobId}`);
  const data = (await response.json()) as DirectorGenerationJob & { message?: string };
  if (!response.ok || !data.success) throw new Error(data.message ?? "Unable to read video generation status.");
  return data;
}
