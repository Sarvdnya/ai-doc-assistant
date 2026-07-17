import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { createCollection } from "./services/qdrant.service.js";

const PORT = Number(process.env.PORT ?? 5000);
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:8b";
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text";
const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";

async function checkOllama(): Promise<void> {
  const response = await fetch(`${OLLAMA_URL}/api/tags`, {
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}`);
  }

  const data = (await response.json()) as { models?: Array<{ name: string }> };
  const models = data.models ?? [];

  const modelNames = models.map((m) => m.name);
  console.log(`  Available models: ${modelNames.join(", ") || "(none)"}`);

  console.log("✓ Ollama Connected");

  const llmMatch = modelNames.find((name) => name.startsWith(OLLAMA_MODEL) || name.includes(OLLAMA_MODEL.replace(/:.*/, "")));
  if (!llmMatch) {
    console.error(`✗ LLM model matching "${OLLAMA_MODEL}" not found. Available: ${modelNames.join(", ") || "(none)"}`);
    process.exit(1);
  }
  if (llmMatch !== OLLAMA_MODEL) {
    console.log(`✓ LLM Ready — using "${llmMatch}" (set OLLAMA_MODEL=${llmMatch} in .env to silence)`);
    process.env.OLLAMA_MODEL = llmMatch;
  } else {
    console.log(`✓ LLM Ready (${OLLAMA_MODEL})`);
  }

  const embMatch = modelNames.find((name) => name.startsWith(OLLAMA_EMBEDDING_MODEL) || name.includes(OLLAMA_EMBEDDING_MODEL.replace(/:.*/, "")));
  if (!embMatch) {
    console.error(`✗ Embedding model matching "${OLLAMA_EMBEDDING_MODEL}" not found. Available: ${modelNames.join(", ") || "(none)"}`);
    process.exit(1);
  }
  if (embMatch !== OLLAMA_EMBEDDING_MODEL) {
    console.log(`✓ Embedding Model Ready — using "${embMatch}" (set OLLAMA_EMBEDDING_MODEL=${embMatch} in .env to silence)`);
    process.env.OLLAMA_EMBEDDING_MODEL = embMatch;
  } else {
    console.log(`✓ Embedding Model Ready (${OLLAMA_EMBEDDING_MODEL})`);
  }
}

async function checkQdrant(): Promise<void> {
  const response = await fetch(`${QDRANT_URL}/`, {
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Qdrant returned ${response.status}`);
  }

  console.log("✓ Qdrant Connected");
}

async function start() {
  try {
    await checkOllama();
  } catch (error) {
    console.error("✗ Ollama connection failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  try {
    await checkQdrant();
  } catch (error) {
    console.error("✗ Qdrant connection failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  await connectDB();
  await createCollection();

  app.listen(PORT, () => {
    console.log(`\nServer running on http://localhost:${PORT}`);

    console.log("\nRegistered routes:");
    const routes: string[] = [];
    app._router?.stack?.forEach((layer: any) => {
      if (layer?.route) {
        const methods = Object.keys(layer.route.methods).join(", ").toUpperCase();
        routes.push(`  ${methods}  ${layer.route.path}`);
      } else if (layer?.name === "router" && layer?.handle?.stack) {
        layer.handle.stack.forEach((stack: any) => {
          if (stack?.route) {
            const methods = Object.keys(stack.route.methods).join(", ").toUpperCase();
            const routePath = layer.regexp.source
              .replace("\\/?(?=\\/|$)", "")
              .replaceAll("\\", "")
              .replaceAll("?", "");
            routes.push(`  ${methods}  ${routePath}${stack.route.path}`);
          }
        });
      }
    });

    if (routes.length === 0) {
      console.log("  GET   /");
      console.log("  POST  /api/upload");
      console.log("  GET   /api/documents");
      console.log("  GET   /api/search");
      console.log("  GET   /api/chat");
      console.log("  POST  /api/chat");
    } else {
      routes.sort().forEach((r) => console.log(r));
    }
  });
}

start();
