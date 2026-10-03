import express from "express";
import database from "./database.js";

const app = express();

app.use(express.json());

app.get("/api/health", (_request, response) => {
  database.prepare("SELECT 1").get();
  response.json({
    status: "ok",
    service: "mini-management-system-backend",
    database: "connected",
  });
});

export default app;
