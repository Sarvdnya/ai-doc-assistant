import type { Request, Response } from "express";
import { generateAllSceneImages } from "../services/imageGeneration.service.js";

export async function generateImages(
  req: Request,
  res: Response
): Promise<void> {
  const { documentId } = req.body;

  if (!documentId || typeof documentId !== "string") {
    res.status(400).json({ success: false, message: "documentId is required" });
    return;
  }

  try {
    const result = await generateAllSceneImages(documentId);

    res.json(result);
  } catch (error) {
    console.error("[IMAGE] Failed:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to generate images",
    });
  }
}
