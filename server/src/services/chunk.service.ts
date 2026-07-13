export interface Chunk {
  id: string;
  documentId: string;
  text: string;
  index: number;
}

export async function chunkText(
  _documentId: string,
  _text: string
): Promise<Chunk[]> {
  return [];
}
