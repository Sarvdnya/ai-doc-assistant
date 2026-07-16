import type { Request, Response } from "express";
import { unlink } from "fs/promises";
import Document from "../models/Document.model.js";
import Chunk from "../models/Chunk.model.js";

export async function listDocuments(req: Request, res: Response): Promise<void> {
  const documents = await Document.find().sort({ uploadedAt: -1 }).lean();
  res.json({ success: true, documents });
}

export async function getDocument(req: Request, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const document = await Document.findById(id).lean();
  if (!document) {
    res.status(404).json({ success: false, message: "Document not found" });
    return;
  }
  res.json({ success: true, document });
}

export async function downloadDocument(req: Request, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const document = await Document.findById(id).lean();
  if (!document) {
    res.status(404).json({ success: false, message: "Document not found" });
    return;
  }

  res.type(document.mimeType);
  res.sendFile(document.path, { headers: { "Content-Disposition": `inline; filename="${document.originalName}"` } });
}

export async function getDocumentChunks(req: Request, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const chunks = await Chunk.find({ documentId: id }).sort({ chunkIndex: 1 }).lean();
  res.json({ success: true, chunks });
}

export async function deleteDocument(req: Request, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const document = await Document.findByIdAndDelete(id).lean();
  if (!document) {
    res.status(404).json({ success: false, message: "Document not found" });
    return;
  }

  await unlink(document.path).catch(() => undefined);
  res.json({ success: true, message: "Document deleted" });
}
