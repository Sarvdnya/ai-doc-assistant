import { Router } from "express";
import {
  listDocuments,
  getDocument,
  downloadDocument,
  deleteDocument,
} from "../controllers/document.controller.js";

const router = Router();

router.get("/", listDocuments);
router.get("/:id/file", downloadDocument);
router.get("/:id", getDocument);
router.delete("/:id", deleteDocument);

export default router;
