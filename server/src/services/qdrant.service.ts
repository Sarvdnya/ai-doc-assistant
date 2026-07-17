import { QdrantClient } from "@qdrant/js-client-rest";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || "";
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || "documents";
const VECTOR_SIZE = 768;

let client: QdrantClient | null = null;

function getClient(): QdrantClient {
  if (!client) {
    client = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY || undefined,
    });
    console.log("[QDRANT] Connected");
  }
  return client;
}

export async function createCollection(): Promise<void> {
  const qdrant = getClient();

  try {
    const collections = await qdrant.getCollections();

    const exists = collections.collections?.some(
      (c) => c.name === COLLECTION_NAME
    );

    if (exists) {
      // Check current vector dimension
      try {
        const info = await qdrant.getCollection(COLLECTION_NAME);
        const currentSize = info.config?.params?.vectors?.size;
        if (currentSize && currentSize !== VECTOR_SIZE) {
          console.log(`[QDRANT] Collection exists with dim ${currentSize}, recreating with dim ${VECTOR_SIZE}`);
          await qdrant.deleteCollection(COLLECTION_NAME);
        } else {
          console.log("[QDRANT] Collection already exists");
          return;
        }
      } catch {
        // If we can't get collection info, just skip recreation
        console.log("[QDRANT] Collection already exists");
        return;
      }
    }

    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine",
      },
    });

    console.log("[QDRANT] Collection created successfully");
  } catch (error) {
    throw new Error(
      `Failed to initialize Qdrant collection: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export interface ChunkData {
  chunkIndex: number;
  pageNumber: number;
  text: string;
}

export async function upsertChunks(
  documentId: string,
  filename: string,
  chunks: ChunkData[],
  vectors: number[][]
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
      documentId,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      text: chunk.text,
      filename,
    },
  }));

  try {
    console.log(`[QDRANT] Uploading ${points.length} vectors`);

    await qdrant.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });

    console.log(`[QDRANT] Stored ${points.length} vectors`);
  } catch (error) {
    throw new Error(
      `Failed to store embeddings in Qdrant: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function deleteDocumentVectors(
  documentId: string
): Promise<void> {
  const qdrant = getClient();

  try {
    await qdrant.delete(COLLECTION_NAME, {
      filter: {
        must: [{ key: "documentId", match: { value: documentId } }],
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to delete vectors for document ${documentId}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function search(
  queryVector: number[],
  limit: number = 5
): Promise<
  Array<{
    documentId: string;
    chunkIndex: number;
    pageNumber: number;
    text: string;
    filename: string;
    score: number;
  }>
> {
  const qdrant = getClient();

  try {
    const results = await qdrant.search(COLLECTION_NAME, {
      vector: queryVector,
      limit,
      with_payload: true,
    });

    return results.map((point) => {
      const payload = point.payload as Record<string, unknown>;
      return {
        documentId: (payload?.documentId as string) ?? "",
        chunkIndex: (payload?.chunkIndex as number) ?? 0,
        pageNumber: (payload?.pageNumber as number) ?? 1,
        text: (payload?.text as string) ?? "",
        filename: (payload?.filename as string) ?? "",
        score: point.score ?? 0,
      };
    });
  } catch (error) {
    throw new Error(
      `Failed to search Qdrant: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
