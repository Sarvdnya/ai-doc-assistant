const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

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
  projectPath: string;
  metadataPath: string;
  scriptPath: string;
  imagePlaceholders: string[];
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
  const response = await fetch(`${API_BASE_URL}/api/video/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId }),
  });

  const data = (await response.json()) as VideoResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? "Failed to generate overview video.");
  }

  return data.project;
}
