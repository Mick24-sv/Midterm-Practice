import { Router } from "express";
import database from "./database.js";
import requireAuthentication from "./auth.middleware.js";
import { validateRecord, validateSearchQuery } from "./input-validation.js";

const router = Router();

router.get("/", requireAuthentication, (request, response, next) => {
  try {
    const normalizedQuery = validateSearchQuery(request.query.q);
    const isAdmin = request.user.role === "admin";
    const records = normalizedQuery
      ? database
        .prepare(
          `SELECT id, title, description, status, owner_id, created_at, updated_at
           FROM records
           WHERE (? = 1 OR owner_id = ?)
             AND (title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')
           ORDER BY created_at DESC, id DESC`
        )
        .all(
          isAdmin ? 1 : 0,
          request.user.id,
          `%${normalizedQuery.replace(/[\\%_]/g, "\\$&")}%`,
          `%${normalizedQuery.replace(/[\\%_]/g, "\\$&")}%`,
        )
      : database
        .prepare(
          `SELECT id, title, description, status, owner_id, created_at, updated_at
           FROM records
           WHERE (? = 1 OR owner_id = ?)
           ORDER BY created_at DESC, id DESC`
        )
        .all(isAdmin ? 1 : 0, request.user.id);

    return response.json({ records });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuthentication, (request, response, next) => {
  const { title, description, status, details } = validateRecord(request.body);

  if (details.length > 0) {
    return response.status(400).json({
      error: "Provide a title (1-200 characters), description (up to 5000 characters), and valid status.",
      code: "validation_error",
      details,
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
