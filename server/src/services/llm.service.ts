const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:8b";

console.log(`[LLM] URL: ${OLLAMA_URL}`);
console.log(`[LLM] Model: ${OLLAMA_MODEL}`);

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function generateText(
  prompt: string,
  system?: string
): Promise<string> {
  console.log(`[LLM] Sending request to Ollama (${OLLAMA_MODEL})`);

  const body: Record<string, unknown> = {
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
  };

  if (system) {
    body.system = system;
  }

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Ollama generate failed (${response.status}): ${text.slice(0, 300)}`
    );
  }

  const data = (await response.json()) as { response: string };

  if (typeof data.response !== "string") {
    throw new Error("Ollama generate response missing 'response' field");
  }

  console.log(`[LLM] Received ${data.response.length} chars`);
  return data.response;
}

export async function chat(
  messages: ChatMessage[]
): Promise<string> {
  console.log(`[LLM] Sending chat to Ollama (${OLLAMA_MODEL})`);

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Ollama chat failed (${response.status}): ${text.slice(0, 300)}`
    );
  }

  const data = (await response.json()) as { message: { content: string } };

  if (!data.message || typeof data.message.content !== "string") {
    throw new Error("Ollama chat response missing message.content");
  }

  console.log(`[LLM] Received ${data.message.content.length} chars`);
  return data.message.content;
}
