import type { Request, Response } from "express";
import { saveUpload } from "../services/upload.service.js";

export async function uploadPdf(req: Request, res: Response): Promise<void> {
  console.log("Upload request received");

  if (!req.file) {
    res.status(400).json({
      success: false,
      message: "No PDF uploaded",
    });
    return;
  }

  const fileMeta = await saveUpload(req.file);

  console.log(fileMeta);

  res.json({
    success: true,
    file: fileMeta,
  });
}
