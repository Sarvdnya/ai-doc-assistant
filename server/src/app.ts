import express from "express";
import path from "path";
import cors from "cors";
import uploadRoutes from "./routes/upload.routes.js";
import documentRoutes from "./routes/document.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import searchRoutes from "./routes/search.routes.js";
import overviewRoutes from "./routes/overview.routes.js";
import videoRoutes from "./routes/video.routes.js";
import videoRenderRoutes from "./routes/video-render.routes.js";

const app = express();

app.use(
  cors({
    origin: [ "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json());

app.use("/api", uploadRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/overview", overviewRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/video", videoRenderRoutes);

const generatedDir = path.resolve(import.meta.dirname, "..", "generated");
app.use("/generated", express.static(generatedDir));

app.get("/", (_req, res) => {
  res.json({ message: "AI Document Assistant API is running 🚀" });
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Request failed:", error.message);
  res.status(400).json({ success: false, message: error.message });
});

export default app;
