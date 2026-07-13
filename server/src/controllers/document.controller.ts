import type { Request, Response } from "express";

export async function listDocuments(req: Request, res: Response): Promise<void> {
  res.json({ success: true, documents: [] });
}

export async function getDocument(req: Request, res: Response): Promise<void> {
  res.json({ success: true, document: null });
}

export async function deleteDocument(req: Request, res: Response): Promise<void> {
  res.json({ success: true, message: "Document deleted" });
}
