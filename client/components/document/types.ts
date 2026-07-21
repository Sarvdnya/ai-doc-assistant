export interface Scene {
  scene: number;
  title: string;
  duration: number;
  narration: string;
  visual: string;
  imagePrompt: string;
  imagePath: string;
  audioPath: string;
}

export interface DocumentOverview {
  title: string;
  duration: string;
  sceneCount: number;
  generatedAt: string;
}

export interface DocumentStoryboard {
  status: "pending" | "ready";
  scenes: Scene[];
}

export interface DocumentVideo {
  status: "pending" | "generating" | "ready" | "failed";
  url?: string;
  duration?: string;
  generatedAt?: string;
}

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

export interface DocumentFile {
  _id: string;

  originalName: string;

  filename: string;

  path: string;

  size: number;

  mimeType: string;

  uploadedAt: string;

  status: string;

  fileUrl: string;

  overview?: DocumentOverview;
  storyboard?: DocumentStoryboard;
  video?: DocumentVideo;
  videoSettings?: VideoSettings;
}
