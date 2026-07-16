import { embedText } from "../ai/embedding.service.js";
import { search as qdrantSearch } from "./qdrant.service.js";

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
  if (!query || query.trim().length === 0) {
    throw new Error("Query cannot be empty");
  }

  console.log("[SEARCH] Creating query embedding");
  const queryVector = await embedText(query);

  console.log("[SEARCH] Searching Qdrant");
  const results = await qdrantSearch(queryVector, limit);

  console.log(`[SEARCH] Found ${results.length} matches`);

  return results.map((r) => ({
    documentId: r.documentId,
    filename: r.filename,
    pageNumber: r.pageNumber,
    chunkIndex: r.chunkIndex,
    text: r.text,
    score: r.score,
  }));
}
