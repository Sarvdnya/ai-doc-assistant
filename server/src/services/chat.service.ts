import OpenAI from "openai";
import { searchSimilarChunks } from "../vector/qdrant.service.js";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Please add it to your .env file."
      );
    }

    client = new OpenAI({ apiKey });
  }
  return client;
}

export interface Source {
  filename: string;
  page: number;
  chunkIndex: number;
}

export interface ChatResult {
  answer: string;
  sources: Source[];
}

export async function askQuestion(question: string): Promise<ChatResult> {
  if (!question || question.trim().length === 0) {
    throw new Error("Question cannot be empty");
  }

  let searchResults;
  try {
    searchResults = await searchSimilarChunks(question, 5);
  } catch (error) {
    throw new Error(
      `Failed to search for relevant content: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (searchResults.length === 0) {
    return {
      answer:
        "I could not find any relevant information in the uploaded documents to answer your question.",
      sources: [],
    };
  }

  const context = searchResults
    .map((r, i) => `[${i + 1}] ${r.text}`)
    .join("\n\n");

  const sources: Source[] = searchResults.map((r) => ({
    filename: r.filename,
    page: r.page,
    chunkIndex: r.chunkIndex,
  }));

  const instructions = `You are an AI assistant that answers questions only using the provided document context. If the answer cannot be found in the context, clearly state that you don't know.

Context:

${context}

Answer the user's question using only the information above. If the context does not contain enough information to answer, say "I don't have enough information to answer that question based on the available documents."`;

  try {
    const response = await getClient().responses.create({
      model: "gpt-4o",
      input: question,
      instructions,
      max_output_tokens: 1024,
    });

    return {
      answer: response.output_text || "I could not generate an answer.",
      sources,
    };
  } catch (error) {
    throw new Error(
      `Failed to generate AI response: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
