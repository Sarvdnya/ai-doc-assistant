import type { Request, Response } from "express";
import mongoose from "mongoose";
import DocumentModel from "../models/Document.model.js";
import { renderVideo } from "../services/videoRenderer.service.js";

export async function renderVideoHandler(
  req: Request,
  res: Response
): Promise<void> {
  const { documentId, force = false } = req.body;

  if (!documentId || typeof documentId !== "string") {
    res.status(400).json({ success: false, message: "documentId is required" });
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    res.status(400).json({ success: false, message: "Invalid documentId" });
    return;
  }

  try {
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      res.status(404).json({ success: false, message: "Document not found" });
      return;
    }
    if (!document.storyboard?.scenes.length) {
      res.status(400).json({ success: false, message: "No saved storyboard scenes found" });
      return;
    }

    console.log("[VIDEO] Using NEW renderer");
    const result = await renderVideo(documentId, {
      scenes: document.storyboard.scenes.map((scene) => ({
        scene: scene.scene,
        duration: scene.duration,
        imagePath: scene.imagePath,
        audioPath: scene.audioPath,
      })),
    }, force === true);
    res.json({
      success: true,
      video: `/${result.videoPath}`,
    });
  } catch (error) {
    console.error("[VIDEO-RENDER] Failed:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to render video",
    });
  }
}
