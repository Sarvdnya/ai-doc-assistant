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
}
