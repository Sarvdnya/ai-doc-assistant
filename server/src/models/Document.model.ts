import mongoose, { Schema, Document } from "mongoose";

interface Scene {
  scene: number;
  title: string;
  duration: number;
  narration: string;
  visual: string;
  imagePrompt: string;
  imagePath: string;
  audioPath: string;
}

export interface IDocument extends Document {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;

  uploadedAt: Date;

  status: "uploading" | "processing" | "embedding" | "ready" | "failed";

  pageCount: number;
  chunkCount: number;
  extractedText: string;
  summary: string;
  processingError: string;

  overview?: {
    title: string;
    duration: string;
    sceneCount: number;
    generatedAt: Date;
  };

  storyboard?: {
    status: "pending" | "ready";
    scenes: Scene[];
  };

  video?: {
    status: "pending" | "generating" | "ready" | "failed";
    url?: string;
    duration?: string;
  };
}

const SceneSchema = new Schema<Scene>(
  {
    scene: { type: Number, required: true },
    title: { type: String, required: true },
    duration: { type: Number, required: true },
    narration: { type: String, required: true },
    visual: { type: String, required: true },
    imagePrompt: { type: String, required: true },
    imagePath: { type: String, required: true },
    audioPath: { type: String, required: true },
  },
  { _id: false }
);

const DocumentSchema = new Schema<IDocument>({
  originalName: {
    type: String,
    required: true,
  },

  filename: {
    type: String,
    required: true,
  },

  path: {
    type: String,
    required: true,
  },

  size: {
    type: Number,
    required: true,
  },

  mimeType: {
    type: String,
    required: true,
  },

  uploadedAt: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    enum: ["uploading", "processing", "embedding", "ready", "failed"],
    default: "uploading",
  },

  pageCount: {
    type: Number,
    default: 0,
  },

  chunkCount: {
    type: Number,
    default: 0,
  },

  extractedText: {
    type: String,
    default: "",
  },

  summary: {
    type: String,
    default: "",
  },

  processingError: {
    type: String,
    default: "",
  },

  overview: {
    type: new Schema(
      {
        title: String,
        duration: String,
        sceneCount: Number,
        generatedAt: Date,
      },
      { _id: false }
    ),
    default: undefined,
  },

  storyboard: {
    type: new Schema(
      {
        status: { type: String, enum: ["pending", "ready"], default: "pending" },
        scenes: [SceneSchema],
      },
      { _id: false }
    ),
    default: undefined,
  },

  video: {
    type: new Schema(
      {
        status: {
          type: String,
          enum: ["pending", "generating", "ready", "failed"],
          default: "pending",
        },
        url: String,
        duration: String,
      },
      { _id: false }
    ),
    default: undefined,
  },
});

export default mongoose.model<IDocument>("Document", DocumentSchema);
