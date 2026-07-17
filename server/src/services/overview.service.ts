import Chunk from "../models/Chunk.model.js";
import DocumentModel from "../models/Document.model.js";
import { generateText } from "./llm.service.js";

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

  const text = await generateText(prompt);

  console.log(`[OVERVIEW] Received ${text.length} chars from LLM`);

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("LLM did not return valid JSON");
  }

  const overview = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  console.log(`[OVERVIEW] Generated "${overview.title}" with ${overview.scenes?.length ?? 0} scenes`);

  return overview;
}
