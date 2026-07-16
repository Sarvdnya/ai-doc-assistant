import { Router } from "express";
import {
  listDocuments,
  getDocument,
  downloadDocument,
  deleteDocument,
  getDocumentChunks,
} from "../controllers/document.controller.js";

const router = Router();

router.get("/", listDocuments);
router.get("/:id/file", downloadDocument);
router.get("/:id", getDocument);
router.get("/:id/chunks", getDocumentChunks);
router.delete("/:id", deleteDocument);

export default router;
