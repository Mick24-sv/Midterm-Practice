import { Router } from "express";
import database from "./database.js";
import requireAuthentication from "./auth.middleware.js";
import { validateRecord, validateRecordId, validateRecordUpdate, validateSearchQuery } from "./input-validation.js";
import { badRequest, forbidden, notFound } from "./errors.js";

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

const recordColumns =
  "id, title, description, status, owner_id, created_at, updated_at";

router.patch("/:id", requireAuthentication, (request, response, next) => {
  try {
    const recordId = validateRecordId(request.params.id);
    const { fields, details } = validateRecordUpdate(request.body);

    if (details.length > 0) {
      return response.status(400).json({
        error: "Provide at least one of title, description, or status with valid values.",
        code: "validation_error",
        details,
      });
    }

    const isAdmin = request.user.role === "admin";
    const existing = database
      .prepare(`SELECT ${recordColumns} FROM records WHERE id = ?`)
      .get(recordId);

    if (!existing) {
      throw notFound("Record not found.");
    }

    if (!isAdmin && existing.owner_id !== request.user.id) {
      throw forbidden("You can only update your own records.");
    }

    const assignments = fields.map((field) => `${field.column} = ?`).join(", ");
    const result = database
      .prepare(
        `UPDATE records
         SET ${assignments}, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .run(...fields.map((field) => field.value), recordId);

    if (result.changes === 0) {
      throw notFound("Record not found.");
    }

    const record = database
      .prepare(`SELECT ${recordColumns} FROM records WHERE id = ?`)
      .get(recordId);

    return response.json({ record });
  } catch (error) {
    return next(error);
  }
});

// [SEC-06] Delete Record API
router.delete("/:id", requireAuthentication, (request, response, next) => {
  try {
    const recordId = validateRecordId(request.params.id);
    const isAdmin = request.user.role === "admin";

    const existing = database
      .prepare(`SELECT ${recordColumns} FROM records WHERE id = ?`)
      .get(recordId);

    if (!existing) {
      throw notFound("Record not found.");
    }

    if (!isAdmin && existing.owner_id !== request.user.id) {
      throw forbidden("You can only delete your own records.");
    }

    database
      .prepare("DELETE FROM records WHERE id = ?")
      .run(recordId);

    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;

