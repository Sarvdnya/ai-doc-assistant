import { GoogleGenAI } from "@google/genai";
import { enterTrace, traceAwait } from "../utils/trace.js";

const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";

export function getLlmModel(): string {
  return process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

let geminiClient: GoogleGenAI | undefined;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  geminiClient ??= new GoogleGenAI({ apiKey });
  return geminiClient;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function generateText(prompt: string, system?: string): Promise<string> {
  const exit = enterTrace("llm.service.generateText");
  try {
    console.log("[LLM] Using Gemini");
    console.log("[LLM] Sending request");

    const response = await traceAwait(
      "llm.service.generateText",
      "await gemini.models.generateContent(...) ",
      "Gemini request",
      getGeminiClient().models.generateContent({
        model: getLlmModel(),
        contents: prompt,
        ...(system ? { config: { systemInstruction: system } } : {}),
      })
    );

    console.log("[LLM] Response received");
    const text = response.text?.trim();
    if (!text) {
      throw new Error("Gemini returned an empty response");
    }
    return text;
  } catch (error) {
    throw new Error(`Failed to generate AI response: ${errorMessage(error)}`);
  } finally {
    exit();
  }
}

export async function chat(messages: ChatMessage[]): Promise<string> {
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const prompt = messages
    .filter((message) => message.role !== "system")
    .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`)
    .join("\n\n");

  return generateText(prompt, system || undefined);
}
