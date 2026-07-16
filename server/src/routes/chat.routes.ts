import { Router } from "express";
import { askQuestion } from "../controllers/chat.controller.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Chat API is running. Use POST /api/chat to ask questions.",
  });
});

router.post("/", askQuestion);

export default router;
