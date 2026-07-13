import type { Express } from "express";

export async function getDocumentById(id: string): Promise<Express.Multer.File | null> {
  return null;
}

export async function deleteDocumentById(id: string): Promise<boolean> {
  return true;
}
