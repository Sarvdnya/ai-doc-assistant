import mongoose from "mongoose";
import DocumentModel from "../models/Document.model.js";
import ChunkModel from "../models/Chunk.model.js";
import { parsePdfPages } from "../parsers/pdfParser.js";
import { chunkText } from "./chunk.service.js";
import { generateEmbedding } from "./embedding.service.js";
import { upsertChunks, deleteDocumentVectors } from "./qdrant.service.js";
import type { ChunkData } from "./qdrant.service.js";

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function processDocument(
  documentId: string,
  filePath: string
): Promise<void> {
  try {
    console.log("[PROCESSOR] Started");

    await DocumentModel.findByIdAndUpdate(documentId, { status: "processing" });

    console.log("[PROCESSOR] Parsing PDF");
    const pages = await parsePdfPages(filePath);

    const pageCount = pages.length;
    console.log(`[PROCESSOR] Extracted ${pageCount} pages`);

    await ChunkModel.deleteMany({ documentId });

    const allText: string[] = [];
    let globalIndex = 0;
    let totalChunks = 0;
    const chunkDataList: ChunkData[] = [];
    const chunkTexts: string[] = [];

    for (const page of pages) {
      const pageChunks = await chunkText(documentId, page.text);

      if (pageChunks.length > 0) {
        console.log(`[CHUNK] Page ${page.pageNumber} -> ${pageChunks.length} chunks`);

        for (const chunk of pageChunks) {
          await ChunkModel.create({
            documentId: new mongoose.Types.ObjectId(documentId),
            chunkIndex: globalIndex,
            text: chunk.text,
            pageNumber: page.pageNumber,
            tokenCount: estimateTokens(chunk.text),
          });

          chunkDataList.push({
            chunkIndex: globalIndex,
            pageNumber: page.pageNumber,
            text: chunk.text,
          });
          chunkTexts.push(chunk.text);

          globalIndex++;
        }

        totalChunks += pageChunks.length;
      }

      allText.push(page.text);
    }

    const extractedText = allText.join("\n\n");
    console.log(`[CHUNK] Saved ${totalChunks} chunks`);

    console.log("[EMBEDDING] Generating embeddings...");
    const vectors: number[][] = [];

    for (let i = 0; i < chunkTexts.length; i++) {
      console.log(`[EMBEDDING] Creating embedding ${i + 1}/${chunkTexts.length}`);
      const vector = await generateEmbedding(chunkTexts[i]);
      vectors.push(vector);
    }

    console.log("[EMBEDDING] Finished");

    const document = await DocumentModel.findById(documentId).lean();
    const filename = document?.originalName ?? "unknown.pdf";

    await deleteDocumentVectors(documentId);
    await upsertChunks(documentId, filename, chunkDataList, vectors);

    await DocumentModel.findByIdAndUpdate(documentId, {
      status: "ready",
      pageCount,
      chunkCount: totalChunks,
      extractedText,
      processingError: "",
    });

    console.log("[PROCESSOR] Completed");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown processing error";
    console.error("[PROCESSOR] Failed:", message);

    await DocumentModel.findByIdAndUpdate(documentId, {
      status: "failed",
      processingError: message,
    }).catch((updateError) =>
      console.error("[PROCESSOR] Failed to update error status:", updateError)
    );
  }
}
