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
