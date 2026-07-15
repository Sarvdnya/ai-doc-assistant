import { unlink } from "fs/promises";

export interface StoredDocument {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  textLength: number;
  uploadedAt: string;
}

const documents = new Map<string, StoredDocument>();

export function addDocument(document: StoredDocument): StoredDocument {
  documents.set(document.id, document);
  return document;
}

export function listStoredDocuments(): StoredDocument[] {
  return [...documents.values()].sort(
    (a, b) => b.uploadedAt.localeCompare(a.uploadedAt)
  );
}

export function getDocumentById(id: string): StoredDocument | null {
  return documents.get(id) ?? null;
}

export async function deleteDocumentById(id: string): Promise<boolean> {
  const document = documents.get(id);
  if (!document) return false;

  await unlink(document.path);
  documents.delete(id);
  return true;
}

const API_URL = "http://localhost:5000/api/documents";

export async function getDocuments() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }

  return response.json();
}
