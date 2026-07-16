import { Router } from "express";
import { generateVideo } from "../controllers/video.controller.js";
import { generateImages } from "../controllers/image-generation.controller.js";

const router = Router();

router.post("/generate", generateVideo);
router.post("/generate-images", generateImages);

export default router;
