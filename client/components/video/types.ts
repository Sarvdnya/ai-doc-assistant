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
