import { badRequest } from "./errors.js";

export function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isValidEmail(email) {
  return (
    typeof email === "string" &&
    Buffer.byteLength(email, "utf8") <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

export function isValidPassword(password) {
  if (typeof password !== "string") {
    return false;
  }

  const length = Buffer.byteLength(password, "utf8");
  return length >= 8 && length <= 72;
}

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

function issue(field, message) {
  return { field, message };
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateRegistration(body) {
  if (!isObject(body)) {
    throw badRequest("A JSON object is required.", {
      code: "invalid_body",
      details: [issue("body", "A JSON object is required.")],
    });
  }

  const details = [];
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (name.length === 0 || name.length > 100 || CONTROL_CHARACTERS.test(name)) {
    details.push(issue("name", "Name must be 1-100 characters and contain no control characters."));
  }
  if (!isValidEmail(email)) {
    details.push(issue("email", "A valid email address is required."));
  }
  if (!isValidPassword(body.password)) {
    details.push(issue("password", "Password must be between 8 and 72 UTF-8 bytes."));
  }

  return { name, email, password: body.password, details };
}

export function validateLogin(body) {
  if (!isObject(body)) {
    throw badRequest("A JSON object is required.", {
      code: "invalid_body",
      details: [issue("body", "A JSON object is required.")],
    });
  }

  const details = [];
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!isValidEmail(email)) {
    details.push(issue("email", "A valid email address is required."));
  }
  if (!isValidPassword(body.password)) {
    details.push(issue("password", "Password must be between 8 and 72 UTF-8 bytes."));
  }

  return { email, password: body.password, details };
}

export function validateSearchQuery(rawQuery) {
  if (rawQuery === undefined) {
    return "";
  }

  if (typeof rawQuery !== "string" || rawQuery.length > 200) {
    throw badRequest("Search query must be a string of at most 200 characters.", {
      code: "validation_error",
      details: [issue("q", "Search query must be a string of at most 200 characters.")],
    });
  }

  return rawQuery.trim();
}

export function validateRecord(body) {
  if (!isObject(body)) {
    throw badRequest("A JSON object is required.", {
      code: "invalid_body",
      details: [issue("body", "A JSON object is required.")],
    });
  }

  const details = [];
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = body.description === undefined ? "" : body.description;
  const status = body.status === undefined ? "active" : body.status;

  if (!isNonEmptyString(title) || title.length > 200 || CONTROL_CHARACTERS.test(title)) {
    details.push(issue("title", "Title must be 1-200 characters and contain no control characters."));
  }
  if (typeof description !== "string" || description.length > 5000) {
    details.push(issue("description", "Description must be a string of at most 5000 characters."));
  }
  if (status !== "active" && status !== "archived") {
    details.push(issue("status", "Status must be either active or archived."));
  }

  return { title, description, status, details };
}