import { generateEmbedding } from "./embedding.service.js";
import { search as qdrantSearch } from "./qdrant.service.js";
import { enterTrace, traceAwait } from "../utils/trace.js";

export async function searchDocuments(
  query: string,
  limit: number = 5
): Promise<
  Array<{
    documentId: string;
    filename: string;
    pageNumber: number;
    chunkIndex: number;
    text: string;
    score: number;
  }>
> {
  const exit = enterTrace("search.service.searchDocuments");
  try {
  if (!query || query.trim().length === 0) {
    throw new Error("Query cannot be empty");
  }

  console.log("[SEARCH] Creating query embedding");
  const queryVector = await traceAwait("search.service.searchDocuments", "await generateEmbedding(query)", "Embedding generation", generateEmbedding(query));

  console.log("[SEARCH] Searching Qdrant");
  const results = await traceAwait("search.service.searchDocuments", "await qdrantSearch(queryVector, limit)", "Qdrant search", qdrantSearch(queryVector, limit));

  console.log(`[SEARCH] Found ${results.length} matching chunks`);

  return results.map((r) => ({
    documentId: r.documentId,
    filename: r.filename,
    pageNumber: r.pageNumber,
    chunkIndex: r.chunkIndex,
    text: r.text,
    score: r.score,
  }));
  } finally {
    exit();
  }
}
