export interface EmbeddingResult {
  vector: number[];
  dimensions: number;
}

export async function generateEmbedding(_text: string): Promise<EmbeddingResult> {
  throw new Error("AI embedding not implemented yet");
}

export async function generateEmbeddings(_texts: string[]): Promise<EmbeddingResult[]> {
  throw new Error("AI embedding not implemented yet");
}
