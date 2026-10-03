import { Router } from "express";
import database from "./database.js";
import requireAuthentication from "./auth.middleware.js";

const router = Router();

router.get("/", requireAuthentication, (request, response, next) => {
  try {
    const records = database
      .prepare(
        `SELECT id, title, description, status, owner_id, created_at, updated_at
         FROM records
         WHERE owner_id = ?
         ORDER BY created_at DESC, id DESC`
      )
      .all(request.user.id);

    return response.json({ records });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuthentication, (request, response, next) => {
  const body = request.body;
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return response.status(400).json({ error: "A JSON object is required." });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = body.description === undefined ? "" : body.description;
  const status = body.status === undefined ? "active" : body.status;

  if (
    title.length === 0 ||
    title.length > 200 ||
    typeof description !== "string" ||
    description.length > 5000 ||
    !["active", "archived"].includes(status)
  ) {
    return response.status(400).json({
      error: "Provide a title (1-200 characters), description (up to 5000 characters), and valid status.",
    });
  }

  try {
    const result = database
      .prepare(
        `INSERT INTO records (title, description, status, owner_id)
         VALUES (?, ?, ?, ?)`
      )
      .run(title, description, status, request.user.id);
    const record = database
      .prepare(
        `SELECT id, title, description, status, owner_id, created_at, updated_at
         FROM records WHERE id = ?`
      )
      .get(result.lastInsertRowid);

    return response.status(201).json({ record });
  } catch (error) {
    return next(error);
  }
});

export default router;
