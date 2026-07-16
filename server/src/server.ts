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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
