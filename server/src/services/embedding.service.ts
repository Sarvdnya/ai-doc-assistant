const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text";

export async function generateEmbedding(text: string): Promise<number[]> {
  console.log(`[EMBEDDING] Generating embedding via Ollama (${EMBEDDING_MODEL})`);

  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Ollama embedding failed (${response.status}): ${body.slice(0, 200)}`
    );
  }

  const data = (await response.json()) as { embedding: number[] };

  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error("Ollama embedding response missing embedding array");
  }

  console.log(`[EMBEDDING] Generated ${data.embedding.length}-dim vector`);
  return data.embedding;
}
