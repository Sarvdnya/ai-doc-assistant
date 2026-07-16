import mongoose, { Schema, Document } from "mongoose";


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
  
}

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
});

export default mongoose.model<IDocument>(
  "Document",
  DocumentSchema
);