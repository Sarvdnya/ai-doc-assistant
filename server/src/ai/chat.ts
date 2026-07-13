export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  reply: string;
  sources: string[];
}

export async function askQuestion(
  _documentId: string,
  _messages: ChatMessage[]
): Promise<ChatResult> {
  throw new Error("AI chat not implemented yet");
}
