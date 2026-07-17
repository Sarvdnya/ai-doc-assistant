import type { Request, Response } from "express";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const GENERATED_DIR = path.resolve(import.meta.dirname, "../..", "generated");
const METADATA_DIR = path.join(GENERATED_DIR, "metadata");
const IMAGES_DIR = path.join(GENERATED_DIR, "images");

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export interface ProjectSummary {
  id: string;
  title: string;
  createdAt: string;
  sceneCount: number;
  duration: string;
  status: "generated" | "images_generated";
  thumbnail: string | null;
  metadataPath: string;
}

export async function listProjects(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    await fs.mkdir(METADATA_DIR, { recursive: true });

    const files = fsSync
      .readdirSync(METADATA_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();

    const projects: ProjectSummary[] = [];

    for (const file of files) {
      const filePath = path.join(METADATA_DIR, file);
      try {
        const raw = fsSync.readFileSync(filePath, "utf-8");
        const data = JSON.parse(raw);

        const projectId = data.projectId ?? file.replace(/\.json$/, "");

        // Determine status by checking if first scene image exists
        let status: "generated" | "images_generated" = "generated";
        let thumbnail: string | null = null;

        if (data.scenes && data.scenes.length > 0) {
          const firstScene = data.scenes[0];
          const padded = pad(firstScene.scene);
          const pngPath = path.join(IMAGES_DIR, `scene-${padded}.png`);
          const svgPath = path.join(IMAGES_DIR, `scene-${padded}.svg`);

          if (fsSync.existsSync(pngPath)) {
            status = "images_generated";
            thumbnail = `generated/images/scene-${padded}.png`;
          } else if (fsSync.existsSync(svgPath)) {
            status = "images_generated";
            thumbnail = `generated/images/scene-${padded}.svg`;
          }
        }

        projects.push({
          id: projectId,
          title: data.title ?? "Untitled Project",
          createdAt: data.generatedAt ?? file.replace(/\.json$/, ""),
          sceneCount: data.sceneCount ?? data.scenes?.length ?? 0,
          duration: data.duration ?? "0s",
          status,
          thumbnail,
          metadataPath: filePath,
        });
      } catch {
        // Skip unparseable files
      }
    }

    res.json({ success: true, projects });
  } catch (error) {
    console.error("[PROJECTS] Failed to list:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to list projects",
    });
  }
}

export async function getProject(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    res.status(400).json({ success: false, message: "Project ID is required" });
    return;
  }

  try {
    const filePath = path.join(METADATA_DIR, `${id}.json`);
    if (!fsSync.existsSync(filePath)) {
      res.status(404).json({ success: false, message: "Project not found", requestedId: id });
      return;
    }

    const raw = await fs.readFile(filePath, "utf-8");
    const project = JSON.parse(raw);

    res.json({ success: true, project });
  } catch (error) {
    console.error("[PROJECTS] Failed to get:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get project",
    });
  }
}

export async function deleteProject(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    res.status(400).json({ success: false, message: "Project ID is required" });
    return;
  }

  try {
    const metadataPath = path.join(METADATA_DIR, `${id}.json`);
    if (!fsSync.existsSync(metadataPath)) {
      res.status(404).json({ success: false, message: "Project not found", requestedId: id });
      return;
    }

    const raw = fsSync.readFileSync(metadataPath, "utf-8");
    const project = JSON.parse(raw);

    // Delete scene files
    const sceneCount = project.sceneCount ?? project.scenes?.length ?? 0;
    for (let i = 1; i <= sceneCount; i++) {
      const padded = pad(i);
      const filesToDelete = [
        path.join(IMAGES_DIR, `scene-${padded}.json`),
        path.join(IMAGES_DIR, `scene-${padded}.png`),
        path.join(IMAGES_DIR, `scene-${padded}.svg`),
      ];

      for (const f of filesToDelete) {
        try {
          await fs.unlink(f);
        } catch {
          // File may not exist; ignore
        }
      }
    }

    // Delete metadata file
    await fs.unlink(metadataPath);

    console.log(`[PROJECTS] Deleted project ${id}`);
    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("[PROJECTS] Failed to delete:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete project",
    });
  }
}
