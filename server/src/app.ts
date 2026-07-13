import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import uploadRoutes from "./routes/upload.routes.js";
import documentRoutes from "./routes/document.routes.js";
import chatRoutes from "./routes/chat.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(express.json());

app.use("/api/upload", uploadRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "AI Document Assistant API is running 🚀" });
});

export default app;
