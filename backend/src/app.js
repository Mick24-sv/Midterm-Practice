import express from "express";
import database from "./database.js";
import authRoutes from "./auth.routes.js";
import recordRoutes from "./records.routes.js";

const app = express();

app.use(express.json({ limit: "32kb" }));
app.use("/api/auth", authRoutes);
app.use("/api/records", recordRoutes);

app.get("/api/health", (_request, response) => {
  database.prepare("SELECT 1").get();
  response.json({
    status: "ok",
    service: "mini-management-system-backend",
    database: "connected",
  });
});

app.use((error, _request, response, next) => {
  if (error.type === "entity.parse.failed") {
    return response.status(400).json({ error: "Request body must contain valid JSON." });
  }
  if (error.type === "entity.too.large") {
    return response.status(413).json({ error: "Request body must not exceed 32 KB." });
  }
  return next(error);
});

export default app;
