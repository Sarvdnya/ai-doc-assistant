import app from "./app.js";
import { connectDB } from "./config/db.js";


async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();

const PORT = Number(process.env.PORT ?? 5000);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
