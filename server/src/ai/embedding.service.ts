import { OpenAIEmbeddings } from "@langchain/openai";
import type { Document } from "@langchain/core/documents";

let embeddings: OpenAIEmbeddings | null = null;

function getEmbeddings(): OpenAIEmbeddings {
  if (!embeddings) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Please add it to your .env file."
      );
    }

    embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      apiKey,
    });
  }
  return embeddings;
}

export async function generateEmbeddings(
  chunks: Document[]
): Promise<number[][]> {
  if (chunks.length === 0) {
    throw new Error("Cannot generate embeddings: chunk list is empty");
  }

  const texts = chunks.map((chunk) => chunk.pageContent);

  try {
    const vectors = await getEmbeddings().embedDocuments(texts);
    return vectors;
  } catch (error) {
    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
