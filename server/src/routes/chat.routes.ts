import { Router } from "express";
import { sendMessage, getHistory } from "../controllers/chat.controller.js";

const router = Router();

router.post("/message", sendMessage);
router.get("/history", getHistory);

export default router;
