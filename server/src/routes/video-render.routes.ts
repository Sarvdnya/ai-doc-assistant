import { Router } from "express";
import { renderVideoHandler } from "../controllers/video-render.controller.js";

const router = Router();

router.post("/render", renderVideoHandler);

export default router;
