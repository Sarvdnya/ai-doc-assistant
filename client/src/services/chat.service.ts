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

export async function askQuestion(question: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  const data = (await response.json()) as ChatResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? "Something went wrong.");
  }

  return data;
}
