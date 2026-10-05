import express from "express";
import database from "./database.js";
import authRoutes from "./auth.routes.js";
import recordRoutes from "./records.routes.js";
import { notFoundHandler, errorHandler } from "./error.middleware.js";
import { serviceUnavailable } from "./errors.js";

const app = express();

app.use(express.json({ limit: "32kb" }));
app.use("/api/auth", authRoutes);
app.use("/api/records", recordRoutes);

app.get("/api/health", (_request, response, next) => {
  try {
    database.prepare("SELECT 1").get();
  } catch (error) {
    return next(
      serviceUnavailable("Database is unavailable.", { cause: error }),
    );
  }

  return response.json({
    status: "ok",
    service: "mini-management-system-backend",
    database: "connected",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;