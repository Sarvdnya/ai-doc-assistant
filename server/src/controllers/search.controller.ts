import type { Request, Response } from "express";
import { searchDocuments } from "../services/search.service.js";

export async function search(req: Request, res: Response): Promise<void> {
  const query = typeof req.query.q === "string" ? req.query.q : "";

  if (!query.trim()) {
    res.status(400).json({ success: false, message: "Query parameter 'q' is required" });
    return;
  }

  try {
    const results = await searchDocuments(query, 5);
    res.json({ success: true, results });
  } catch (error) {
    console.error("[SEARCH] Failed:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Search failed",
    });
  }
}
