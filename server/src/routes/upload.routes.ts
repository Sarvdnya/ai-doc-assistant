import { Router } from "express";
import upload from "../middleware/upload.js";
import { uploadPdf } from "../controllers/upload.controller.js";

const router = Router();

router.post("/", upload.single("pdf"), uploadPdf);

export default router;
