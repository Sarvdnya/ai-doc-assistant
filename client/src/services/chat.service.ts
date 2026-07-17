export interface Source {
  filename: string;
  pageNumber: number;
  chunkIndex: number;
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  sources: Source[];
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const REQUEST_TIMEOUT = Number(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT ?? 120000);

export async function askQuestion(question: string): Promise<ChatResponse> {
  console.log("[CHAT UI] Sending request");
  console.log("[CHAT UI] Waiting for Ollama...");
  console.time("chat-request");

  const url = `${API_BASE_URL}/api/chat`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  console.timeEnd("chat-request");
  console.log("[CHAT UI] Response received", response.status, response.ok);

  const data = (await response.json()) as ChatResponse;

  console.log("[CHAT UI] JSON parsed", data);

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? "Something went wrong.");
  }

  return data;
}
