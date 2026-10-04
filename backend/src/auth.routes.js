import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import database from "./database.js";
import { isObject, isValidEmail, isValidPassword } from "./input-validation.js";

const router = Router();
const passwordRounds = 12;
const tokenLifetimeSeconds = 60 * 60;

function createToken(user) {
  return jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      subject: String(user.id),
      issuer: "mini-management-system",
      audience: "mini-management-system-api",
      expiresIn: tokenLifetimeSeconds,
    },
  );
}

function authenticationResponse(response, user) {
  response.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: createToken(user),
    tokenType: "Bearer",
    expiresIn: tokenLifetimeSeconds,
  });
}

router.post("/register", async (request, response, next) => {
  const { name, email, password } = isObject(request.body) ? request.body : {};
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (
    normalizedName.length === 0 ||
    normalizedName.length > 100 ||
    /[\u0000-\u001f\u007f]/.test(normalizedName) ||
    !isValidEmail(normalizedEmail) ||
    !isValidPassword(password)
  ) {
    return response.status(400).json({
      error: "Provide a name, valid email, and password between 8 and 72 UTF-8 bytes.",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, passwordRounds);
    const result = database
      .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
      .run(normalizedName, normalizedEmail, passwordHash);
    const user = {
      id: Number(result.lastInsertRowid),
      name: normalizedName,
      email: normalizedEmail,
      role: "user",
    };

    return response.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: createToken(user),
      tokenType: "Bearer",
      expiresIn: tokenLifetimeSeconds,
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return response.status(409).json({ error: "An account with that email already exists." });
    }
    return next(error);
  }
});

router.post("/login", async (request, response, next) => {
  const { email, password } = isObject(request.body) ? request.body : {};
  const normalizedEmail = typeof email === "string" ? email.trim() : "";

  if (
    !isValidEmail(normalizedEmail) ||
    !isValidPassword(password)
  ) {
    return response.status(400).json({ error: "Provide a valid email and password." });
  }

  try {
    const user = database
      .prepare("SELECT id, name, email, password_hash, role FROM users WHERE email = ?")
      .get(normalizedEmail);

    if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return response.status(401).json({ error: "Invalid email or password." });
    }

    return authenticationResponse(response, user);
  } catch (error) {
    return next(error);
  }
});

export default router;
