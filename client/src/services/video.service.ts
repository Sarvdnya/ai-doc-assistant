import { fetchWithDiagnostics } from "./fetch.service";
import type { VideoSettings } from "./director.service";

export interface VideoGenerationResult {
  success: boolean;
  videoUrl: string;
  title: string;
  duration: string;
  sceneCount: number;
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function generateOverviewVideo(documentId: string, settings: VideoSettings): Promise<VideoGenerationResult> {
  const url = `${API_BASE_URL}/api/video/generate`;
  const body = JSON.stringify({ documentId, settings, force: true });

  console.log("[VIDEO API] URL:", url);
  console.log("[VIDEO API] Request Body:", body);

  const response = await fetchWithDiagnostics(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  console.log("[VIDEO API] Status:", response.status);

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("text/html") || contentType.includes("text/plain")) {
    const text = await response.text();
    console.log("[VIDEO API] Response:", text);
    throw new Error(
      `Expected JSON from ${url} but received HTML (status ${response.status}). ` +
      `Make sure the backend is running on ${API_BASE_URL} and POST /api/video/generate is registered.`
    );
  }

  const data = (await response.json()) as VideoGenerationResult;
  console.log("[VIDEO API] Response:", data);

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? `Video generation failed with status ${response.status}`);
  }
  return data;
}
