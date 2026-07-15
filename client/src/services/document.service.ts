import axios from "axios";
import type { DocumentFile } from "@/components/document/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const DOCUMENTS_URL = `${API_BASE_URL}/api/documents`;
const UPLOAD_URL = `${API_BASE_URL}/api/upload`;

type ApiDocument = Omit<DocumentFile, "_id" | "fileUrl"> & {
  _id?: string;
  id?: string;
};

interface DocumentsResponse {
  success: boolean;
  documents?: ApiDocument[];
  message?: string;
}

interface UploadResponse {
  success: boolean;
  document?: DocumentFile;
  message?: string;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

function toDocumentFile(document: ApiDocument): DocumentFile {
  const id = document._id ?? document.id;

  if (!id) {
    throw new Error("A document returned by the API is missing its identifier.");
  }

  return {
    ...document,
    _id: id,
    fileUrl: `${DOCUMENTS_URL}/${id}/file`,
  };
}

export async function getDocuments(): Promise<DocumentFile[]> {
  const response = await fetch(DOCUMENTS_URL);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = (await response.json()) as DocumentsResponse;

  if (!data.success || !data.documents) {
    throw new Error(data.message ?? "Failed to fetch documents.");
  }

  return data.documents.map(toDocumentFile);
}

export async function uploadDocument(
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  const formData = new FormData();
  formData.append("pdf", file);

  const response = await axios.post<UploadResponse>(UPLOAD_URL, formData, {
    onUploadProgress(progressEvent) {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });

  if (!response.data.success) {
    throw new Error(response.data.message ?? "Failed to upload document.");
  }
}

export async function deleteDocument(id: string): Promise<void> {
  const response = await axios.delete<{ success: boolean; message?: string }>(
    `${DOCUMENTS_URL}/${id}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message ?? "Failed to delete document.");
  }
}
