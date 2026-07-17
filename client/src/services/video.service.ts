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
  projectId?: string;
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

export interface ProjectSummary {
  id: string;
  title: string;
  createdAt: string;
  sceneCount: number;
  duration: string;
  status: "generated" | "images_generated";
  thumbnail: string | null;
  metadataPath: string;
}

export interface ProjectListResponse {
  success: boolean;
  projects: ProjectSummary[];
  message?: string;
}

export interface ProjectDetailResponse {
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

export async function getProjects(): Promise<ProjectSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/projects`);

  const data = (await response.json()) as ProjectListResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? "Failed to load projects.");
  }

  return data.projects;
}

export async function getProjectById(id: string): Promise<VideoProject> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${encodeURIComponent(id)}`);

  const data = (await response.json()) as ProjectDetailResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? "Failed to load project.");
  }

  return data.project;
}

export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  const data: { success: boolean; message?: string } = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? "Failed to delete project.");
  }
}
