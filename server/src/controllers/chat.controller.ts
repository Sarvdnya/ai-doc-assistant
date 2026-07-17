import type { Request, Response } from "express";
import { askQuestion as getAnswer } from "../services/chat.service.js";
import { enterTrace, traceAwait } from "../utils/trace.js";

export async function askQuestion(req: Request, res: Response): Promise<void> {
  const exit = enterTrace("chat.controller.askQuestion");
  try {
  const { question } = req.body;

  if (!question || typeof question !== "string" || !question.trim()) {
    res.status(400).json({ success: false, message: "Question is required" });
    return;
  }

    const result = await traceAwait("chat.controller.askQuestion", "await getAnswer(question)", "chat.service.askQuestion", getAnswer(question));
    res.json({ success: true, answer: result.answer, sources: result.sources });
  } catch (error) {
    console.error("[CHAT] Failed:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Chat failed",
    });
  } finally {
    exit();
  }
}
