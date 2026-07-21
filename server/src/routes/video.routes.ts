import { Router } from "express";
import { generateVideo } from "../controllers/video.controller.js";
import { generateImages } from "../controllers/image-generation.controller.js";
import { directorChat, getDirectorVideoGenerationStatus, startDirectorVideoGeneration } from "../controllers/director.controller.js";

const router = Router();

router.post("/generate", generateVideo);
router.post("/generate-images", generateImages);
router.post("/director", directorChat);
router.post("/director/generate", startDirectorVideoGeneration);
router.get("/director/jobs/:jobId", getDirectorVideoGenerationStatus);

export default router;
