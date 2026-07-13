import type { Request, Response } from "express";

export async function sendMessage(req: Request, res: Response): Promise<void> {
  res.json({ success: true, message: "Chat not implemented yet" });
}

export async function getHistory(req: Request, res: Response): Promise<void> {
  res.json({ success: true, history: [] });
}
