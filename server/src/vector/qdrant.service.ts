import { QdrantClient } from "@qdrant/js-client-rest";
import { Document } from "@langchain/core/documents";
import { generateEmbeddings } from "../ai/embedding.service.js";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || "documents";
const VECTOR_SIZE = 1536;

let client: QdrantClient | null = null;

function getClient(): QdrantClient {
  if (!client) {
    client = new QdrantClient({
      url: QDRANT_URL,
    });
  }
  return client;
}

export async function initializeCollection(): Promise<void> {
  const qdrant = getClient();

  try {
    const collections = await qdrant.getCollections();

    const exists = collections.collections?.some(
      (c) => c.name === COLLECTION_NAME
    );

    if (exists) {
      console.log(`Collection "${COLLECTION_NAME}" already exists`);
      return;
    }

    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine",
      },
    });

    console.log(`Collection "${COLLECTION_NAME}" created`);
  } catch (error) {
    throw new Error(
      `Failed to initialize Qdrant collection: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function storeEmbeddings(
  chunks: Document[],
  vectors: number[][],
  filename: string
): Promise<void> {
  if (chunks.length !== vectors.length) {
    throw new Error(
      `Chunk count (${chunks.length}) and vector count (${vectors.length}) do not match`
    );
  }

  if (chunks.length === 0) {
    throw new Error("Cannot store embeddings: no chunks to store");
  }

  const qdrant = getClient();

  const points = chunks.map((chunk, i) => ({
    id: crypto.randomUUID(),
    vector: vectors[i],
    payload: {
      text: chunk.pageContent,
      filename,
      chunkIndex: chunk.metadata.chunkIndex ?? i,
      page: chunk.metadata.page ?? 1,
    },
  }));

  try {
    await qdrant.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });

    console.log(`Stored ${points.length} vectors in Qdrant`);
  } catch (error) {
    throw new Error(
      `Failed to store embeddings in Qdrant: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export interface SearchResult {
  text: string;
  filename: string;
  chunkIndex: number;
  page: number;
  score: number;
}

export async function searchSimilarChunks(
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  const qdrant = getClient();

  const queryDoc = new Document({ pageContent: query });
  const queryVector = await generateEmbeddings([queryDoc]);

  try {
    const results = await qdrant.search(COLLECTION_NAME, {
      vector: queryVector[0],
      limit,
      with_payload: true,
    });

    return results.map((point) => {
      const payload = point.payload as Record<string, unknown>;
      return {
        text: payload?.text as string,
        filename: payload?.filename as string,
        chunkIndex: payload?.chunkIndex as number,
        page: payload?.page as number,
        score: point.score ?? 0,
      };
    });
  } catch (error) {
    throw new Error(
      `Failed to search Qdrant: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
