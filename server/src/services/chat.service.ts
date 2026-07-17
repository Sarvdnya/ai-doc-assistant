import { searchDocuments } from "./search.service.js";
import { generateText } from "./llm.service.js";
import { enterTrace, traceAwait } from "../utils/trace.js";

export interface Source {
  filename: string;
  pageNumber: number;
  chunkIndex: number;
}

export interface ChatResult {
  answer: string;
  sources: Source[];
}

export async function askQuestion(question: string): Promise<ChatResult> {
  const exit = enterTrace("chat.service.askQuestion");
  try {
  console.log("[CHAT] Question received");

  if (!question || question.trim().length === 0) {
    throw new Error("Question cannot be empty");
  }

  console.log("[CHAT] Searching Qdrant");
  const results = await traceAwait("chat.service.askQuestion", "await searchDocuments(question, 5)", "search.service.searchDocuments", searchDocuments(question, 5));

  console.log(`[CHAT] Retrieved ${results.length} chunks`);

  if (results.length === 0) {
    return {
      answer:
        "I couldn't find this information in the uploaded documents.",
      sources: [],
    };
  }

  const context = results
    .map((r, i) => `[${i + 1}] ${r.text}`)
    .join("\n\n");

  const sources: Source[] = results.map((r) => ({
    filename: r.filename,
    pageNumber: r.pageNumber,
    chunkIndex: r.chunkIndex,
  }));

  const system = `You are an AI Document Assistant.

Answer ONLY using the provided context.

If the answer is not found in the context, reply:

"I couldn't find this information in the uploaded documents."`;

  const prompt = `Context:

${context}

Question:

${question}`;

  console.log("[CHAT] Sending to LLM");

  try {
    const answer = await traceAwait("chat.service.askQuestion", "await generateText(prompt, system)", "llm.service.generateText", generateText(prompt, system));

    console.log("[CHAT] Answer generated");

    return {
      answer: answer || "I couldn't find this information in the uploaded documents.",
      sources,
    };
  } catch (error) {
    throw new Error(
      `Failed to generate AI response: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  } finally {
    exit();
  }
}
