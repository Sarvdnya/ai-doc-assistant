import Document from "../models/Document.model.js";
import { parsePdf } from "../parsers/pdfParser.js";
import { chunkText } from "./chunk.service.js";

/**
 * Processes a stored PDF without blocking the upload response. Chunks are
 * created in memory for now; embedding/vector persistence is intentionally
 * deferred until that pipeline is added.
 */
export async function processDocument(
  documentId: string,
  filePath: string
): Promise<void> {
  try {
    console.log(`[${documentId}] Processing...`);
    await Document.findByIdAndUpdate(documentId, { status: "processing" });

    console.log(`[${documentId}] Parsing PDF...`);
    const { text, pageCount } = await parsePdf(filePath);

    console.log(`[${documentId}] Extracting text...`);
    console.log(`[${documentId}] Chunking...`);
    const chunks = await chunkText(documentId, text);

    console.log(`[${documentId}] Updating MongoDB...`);
    await Document.findByIdAndUpdate(documentId, {
      status: "ready",
      pageCount,
      chunkCount: chunks.length,
      extractedText: text,
    });

    console.log(`[${documentId}] Processing Complete`);
  } catch (error) {
    console.error(`[${documentId}] Processing failed:`, error);
    await Document.findByIdAndUpdate(documentId, { status: "failed" }).catch(
      (updateError) => console.error(`[${documentId}] Failed to update status:`, updateError)
    );
  }
}
