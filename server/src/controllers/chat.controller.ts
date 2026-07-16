import type { Request, Response } from "express";
import { askQuestion as getAnswer } from "../services/chat.service.js";

export async function askQuestion(req: Request, res: Response): Promise<void> {
  const { question } = req.body;

  if (!question || typeof question !== "string" || !question.trim()) {
    res.status(400).json({ success: false, message: "Question is required" });
    return;
  }

  try {
    const result = await getAnswer(question);
    res.json({ success: true, answer: result.answer, sources: result.sources });
  } catch (error) {
    console.error("[CHAT] Failed:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Chat failed",
    });
  }
}
