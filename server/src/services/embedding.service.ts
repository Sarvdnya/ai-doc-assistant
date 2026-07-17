const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text";
import { fetchWithDiagnostics, throwForFailedResponse } from "./fetch.service.js";
import { enterTrace, traceAwait } from "../utils/trace.js";

export async function generateEmbedding(text: string): Promise<number[]> {
  const exit = enterTrace("embedding.service.generateEmbedding");
  try {
  console.log(`[EMBEDDING] Generating embedding via Ollama (${EMBEDDING_MODEL})`);

  const url = `${OLLAMA_URL}/api/embeddings`;
  const response = await traceAwait("embedding.service.generateEmbedding", "await fetchWithDiagnostics(...) ", "Embedding generation", fetchWithDiagnostics("embedding.service.ts", url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text,
    }),
  }));

  await traceAwait("embedding.service.generateEmbedding", "await throwForFailedResponse(...) ", "Embedding response validation", throwForFailedResponse("embedding.service.ts", url, response));

  const data = (await traceAwait("embedding.service.generateEmbedding", "await response.json()", "Embedding response body", response.json())) as { embedding: number[] };

  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error("Ollama embedding response missing embedding array");
  }

  console.log(`[EMBEDDING] Generated ${data.embedding.length}-dim vector`);
  return data.embedding;
  } finally {
    exit();
  }
}
