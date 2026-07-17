import type { Request, Response } from "express";
import mongoose from "mongoose";
import { runVideoPipeline } from "../services/videoPipeline.service.js";

export async function generateVideo(
  req: Request,
  res: Response
): Promise<void> {
  const { documentId } = req.body;

  console.log("[VIDEO] Incoming documentId:", documentId);

  if (!documentId || typeof documentId !== "string") {
    res.status(400).json({ success: false, message: "documentId is required" });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    res.status(400).json({ success: false, message: "Invalid documentId" });
    return;
  }

  try {
    console.log("[VIDEO] Starting pipeline");
    const project = await runVideoPipeline(documentId);
    console.log("[VIDEO] Pipeline request completed");
    res.json({ success: true, project });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    console.error("[VIDEO] Pipeline failed\n" + msg);

    if (msg.includes("not found")) {
      res.status(404).json({
        success: false,
        message: msg,
        requestedId: documentId,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: msg,
    });
  }
}
