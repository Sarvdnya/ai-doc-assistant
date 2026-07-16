import type { Request, Response } from "express";
import { renderVideo } from "../services/video-render.service.js";

export async function renderVideoHandler(
  req: Request,
  res: Response
): Promise<void> {
  const { documentId } = req.body;

  if (!documentId || typeof documentId !== "string") {
    res.status(400).json({ success: false, message: "documentId is required" });
    return;
  }

  try {
    const outputPath = await renderVideo(documentId);
    res.json({
      success: true,
      video: "/generated/output/video.mp4",
    });
  } catch (error) {
    console.error("[VIDEO-RENDER] Failed:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to render video",
    });
  }
}
