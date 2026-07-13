import app from "./app.js";
import cors from "cors";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);