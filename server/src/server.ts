import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { createCollection } from "./services/qdrant.service.js";

const PORT = Number(process.env.PORT ?? 5000);

async function start() {
  console.log("Gemini Key:", process.env.GEMINI_API_KEY?.slice(0, 10) + "...");

  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing in .env");
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
            const path = layer.regexp.source
              .replace("\\/?(?=\\/|$)", "")
              .replaceAll("\\", "")
              .replaceAll("?", "");
            routes.push(`  ${methods}  ${path}${stack.route.path}`);
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
