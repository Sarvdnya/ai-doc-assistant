import { randomUUID } from "crypto";

export interface Chunk {
  id: string;
  documentId: string;
  text: string;
  index: number;
}

export async function chunkText(
  documentId: string,
  text: string
): Promise<Chunk[]> {
  const chunkSize = 1_000;
  const overlap = 200;
  const normalizedText = text.trim();

  if (!normalizedText) {
    return [];
  }

  const chunks: Chunk[] = [];
  let start = 0;

  while (start < normalizedText.length) {
    const end = Math.min(start + chunkSize, normalizedText.length);
    const chunk = normalizedText.slice(start, end).trim();

    if (chunk) {
      chunks.push({
        id: randomUUID(),
        documentId,
        text: chunk,
        index: chunks.length,
      });
    }

    if (end === normalizedText.length) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
}
