import type { Express } from "express";
import { addDocument, type StoredDocument } from "./document.service.js";

export async function saveUpload(
  file: Express.Multer.File,
  extractedText: string
): Promise<StoredDocument> {
  return addDocument({
    id: file.filename,
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    mimeType: file.mimetype,
    size: file.size,
    textLength: extractedText.length,
    uploadedAt: new Date().toISOString(),
  });
}
