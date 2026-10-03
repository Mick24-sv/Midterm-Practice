import express from "express";
import database from "./database.js";
import authRoutes from "./auth.routes.js";

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/api/health", (_request, response) => {
  database.prepare("SELECT 1").get();
  response.json({
    status: "ok",
    service: "mini-management-system-backend",
    database: "connected",
  });
});

export default app;
