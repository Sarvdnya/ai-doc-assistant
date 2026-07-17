import type { Request, Response } from "express";
import { generateAllSceneImages } from "../services/imageGeneration.service.js";

export async function generateImages(
  req: Request,
  res: Response
): Promise<void> {
  const { documentId, projectId } = req.body;

  const lookupId = projectId ?? documentId;

  if (!lookupId || typeof lookupId !== "string") {
    res.status(400).json({ success: false, message: "projectId or documentId is required" });
    return;
  }

  try {
    const result = await generateAllSceneImages(lookupId);

    res.json(result);
  } catch (error) {
    console.error("[IMAGE] Failed:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to generate images",
    });
  }
}
