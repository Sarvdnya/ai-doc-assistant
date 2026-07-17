import { Router } from "express";
import { listProjects, getProject, deleteProject } from "../controllers/projects.controller.js";

const router = Router();

router.get("/projects", listProjects);
router.get("/projects/:id", getProject);
router.delete("/projects/:id", deleteProject);

export default router;
