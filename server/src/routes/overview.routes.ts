import { Router } from "express";
import { createOverview } from "../controllers/overview.controller.js";

const router = Router();

router.post("/", createOverview);

export default router;
