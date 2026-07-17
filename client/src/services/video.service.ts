const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
import { fetchWithDiagnostics } from "./fetch.service";

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
  duration: string;
  sceneCount: number;
  scenes: SceneData[];
}

export interface VideoResponse {
  success: boolean;
  project: VideoProject;
  message?: string;
}

export async function generateOverviewVideo(
  documentId: string
): Promise<VideoProject> {
  const url = `${API_BASE_URL}/api/video/generate`;
  const body = JSON.stringify({ documentId });
  try {
    const response = await fetchWithDiagnostics(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = (await response.json()) as VideoResponse;

    if (!response.ok || !data.success) {
      throw new Error(data.message ?? `Video pipeline request failed with status ${response.status}`);
    }
    return data.project;
  } catch (error) {
    throw error;
  }
}
