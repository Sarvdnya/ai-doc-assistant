import type { Request, Response } from "express";
import { generateOverview } from "../services/overview.service.js";
import { generateImagePrompts } from "../services/imagePrompt.service.js";

export async function createOverview(
  req: Request,
  res: Response
): Promise<void> {
  const { documentId } = req.body;

  if (!documentId || typeof documentId !== "string") {
    res.status(400).json({ success: false, message: "documentId is required" });
    return;
  }

  try {
    const overview = await generateOverview(documentId);
    const imagePrompts = generateImagePrompts(overview);

    res.json({ success: true, overview, imagePrompts });
  } catch (error) {
    console.error("[OVERVIEW] Failed:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to generate overview",
    });
  }
}
