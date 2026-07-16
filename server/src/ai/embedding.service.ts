import { GoogleGenAI } from "@google/genai";
import type { Document } from "@langchain/core/documents";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Please add it to your .env file."
      );
    }

    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function generateEmbeddings(
  chunks: Document[]
): Promise<number[][]> {
  if (chunks.length === 0) {
    throw new Error("Cannot generate embeddings: chunk list is empty");
  }

  const texts = chunks.map((chunk) => chunk.pageContent);

  try {
    const response = await getClient().models.embedContent({
      model: "models/gemini-embedding-001",
      contents: texts,
    });

    return (response.embeddings ?? []).map((e) => e.values ?? []);
  } catch (error) {
    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function embedText(text: string): Promise<number[]> {
  try {
    const response = await getClient().models.embedContent({
      model: "models/gemini-embedding-001",
      contents: text,
    });

    return response.embeddings?.[0]?.values ?? [];
  } catch (error) {
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
