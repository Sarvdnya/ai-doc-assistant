import type { Request, Response } from "express";
import Document from "../models/Document.model.js";
import { processDocument } from "../services/documentProcessor.service.js";

export async function uploadPdf(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: "No PDF uploaded",
    });
    return;
  }

  try {
    console.log("Uploading...");
    const document = await Document.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      status: "processing",
    });

    // Do not await processing: the client receives the upload response while
    // the document is parsed and its metadata is updated in the background.
    void processDocument(document._id.toString(), req.file.path);

    res.status(201).json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
}
