import { GoogleGenAI } from "@google/genai";
import Chunk from "../models/Chunk.model.js";
import DocumentModel from "../models/Document.model.js";

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

function buildPrompt(text: string): string {
  return `You are an educational video creator.

Create a NotebookLM-style overview video.

Return JSON only.

Format

{
  "title": "",
  "duration": "90 seconds",
  "scenes": [
    {
      "scene": 1,
      "duration": "8 sec",
      "narration": "",
      "visual": ""
    }
  ]
}

Requirements

- Generate 8–12 scenes.
- Each narration should be 15–30 words.
- Visuals should be simple 2D/flat 3D illustrations.
- Do not use complicated animations.
- Educational style.
- Return JSON only.

Document content:

${text}`;
}

export async function generateOverview(
  documentId: string
): Promise<{
  title: string;
  duration: string;
  scenes: Array<{
    scene: number;
    duration: string;
    narration: string;
    visual: string;
  }>;
}> {
  console.log("[OVERVIEW] Looking up document...");
  console.log("[OVERVIEW] Querying Document model with _id:", documentId);

  const document = await DocumentModel.findById(documentId).lean();

  console.log("[OVERVIEW] Mongo query result:", document ? "found" : "null");

  if (!document) {
    throw new Error(`Document not found (requestedId: ${documentId})`);
  }

  console.log("[OVERVIEW] Document loaded:", document.originalName);
  console.log("[OVERVIEW] Document status:", document.status);
  console.log("[OVERVIEW] Document has extractedText:", document.extractedText ? document.extractedText.length + " chars" : "no");
  console.log("[OVERVIEW] Document chunkCount field:", document.chunkCount);

  console.log("[OVERVIEW] Loading chunks");
  const chunks = await Chunk.find({ documentId })
    .sort({ chunkIndex: 1 })
    .lean();

  console.log("[OVERVIEW] Chunks query returned", chunks.length, "results");

  if (chunks.length === 0) {
    throw new Error(
      `No chunks found for document "${document.originalName}" (${documentId}). Ensure the document was fully processed.`
    );
  }

  const mergedText = chunks.map((c) => c.text).join("\n\n");
  console.log(`[OVERVIEW] Merged ${chunks.length} chunks (${mergedText.length} chars)`);

  const prompt = buildPrompt(mergedText);

  console.log("[OVERVIEW] Sending to Gemini");

  interface RetryInfo {
    retryDelay?: string;
  }

  function extractRetryDelay(err: unknown): number | null {
    try {
      const msg = err instanceof Error ? err.message : String(err);
      const parsed = JSON.parse(msg);
      const details = parsed?.error?.details as RetryInfo[] | undefined;
      if (details) {
        for (const d of details) {
          if (d.retryDelay) {
            const match = d.retryDelay.match(/(\d+(?:\.\d+)?)s/);
            if (match) return parseFloat(match[1]);
          }
        }
      }
    } catch {
      /* ignore parse errors */
    }
    return null;
  }

  function isQuotaError(err: unknown): boolean {
    try {
      const msg = err instanceof Error ? err.message : String(err);
      return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
    } catch {
      return false;
    }
  }

  const MAX_RETRIES = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await getClient().models.generateContent({
        model: "models/gemini-3.5-flash",
        contents: prompt,
        config: {
          maxOutputTokens: 4096,
        },
      });

      const text = response.text || "";
      console.log(`[OVERVIEW] Received ${text.length} chars from Gemini`);

      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("Gemini did not return valid JSON");
      }

      const overview = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      console.log(`[OVERVIEW] Generated "${overview.title}" with ${overview.scenes?.length ?? 0} scenes`);

      return overview;
    } catch (error) {
      lastError = error;

      if (isQuotaError(error)) {
        const delay = extractRetryDelay(error) ?? 30;
        const isLast = attempt === MAX_RETRIES - 1;
        console.log(
          `[OVERVIEW] Quota exceeded (attempt ${attempt + 1}/${MAX_RETRIES}), ` +
          `waiting ${delay}s before ${isLast ? "giving up" : "retrying"}...`
        );
        if (isLast) break;
        await new Promise((r) => setTimeout(r, delay * 1000));
      } else {
        break;
      }
    }
  }

  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `Failed to generate overview: ${msg}` +
    `\n\nThe Gemini API quota is exhausted for gemini-3.5-flash (free tier: 20 requests/day).` +
    `\nTry again tomorrow or set up billing for higher quotas at https://ai.google.dev/pricing`
  );
}
