import { GoogleGenAI } from "@google/genai";
import { searchDocuments } from "./search.service.js";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Please add it to your .env file."
      );
    }

    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

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
  console.log("[CHAT] Question received");

  if (!question || question.trim().length === 0) {
    throw new Error("Question cannot be empty");
  }

  console.log("[CHAT] Searching Qdrant");
  const results = await searchDocuments(question, 5);

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

  const instructions = `You are an AI Document Assistant.

Answer ONLY using the provided context.

If the answer is not found in the context, reply:

"I couldn't find this information in the uploaded documents."

Context:

${context}

Question:

${question}`;

  console.log("[CHAT] Sending context to Gemini");

  try {
    const response = await getClient().models.generateContent({
      model: "models/gemini-3.5-flash",
      contents: question,
      config: {
        systemInstruction: instructions,
        maxOutputTokens: 1024,
      },
    });

    console.log("[CHAT] Answer generated");

    return {
      answer: response.text || "I couldn't find this information in the uploaded documents.",
      sources,
    };
  } catch (error) {
    throw new Error(
      `Failed to generate AI response: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
