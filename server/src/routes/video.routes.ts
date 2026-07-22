import { Router } from "express";
import { generateVideo } from "../controllers/video.controller.js";
import { generateImages } from "../controllers/image-generation.controller.js";
import { directorChat, getDirectorVideoGenerationStatus, startDirectorVideoGeneration } from "../controllers/director.controller.js";
import { sseManager } from "../services/sse.service.js";

const router = Router();

router.post("/generate", generateVideo);
router.post("/generate-images", generateImages);
router.post("/director", directorChat);
router.post("/director/generate", startDirectorVideoGeneration);
router.get("/director/jobs/:jobId", getDirectorVideoGenerationStatus);

router.get("/progress/:documentId", (req, res) => {
  const { documentId } = req.params;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ documentId })}\n\n`);
  sseManager.addClient(documentId, res);
  const keepAlive = setInterval(() => res.write(":keepalive\n\n"), 15000);
  req.on("close", () => clearInterval(keepAlive));
});

export default router;
