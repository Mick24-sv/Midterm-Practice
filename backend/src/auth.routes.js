import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import database from "./database.js";
import { validateLogin, validateRegistration } from "./input-validation.js";
import { conflict, unauthorized } from "./errors.js";

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
  const { name, username, email, password, details } = validateRegistration(request.body);

  if (details.length > 0) {
    return response.status(400).json({
      error: "Provide a name, valid username, valid email, and password between 8 and 72 UTF-8 bytes.",
      code: "validation_error",
      details,
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, passwordRounds);
    const result = database
      .prepare("INSERT INTO users (name, username, email, password_hash) VALUES (?, ?, ?, ?)")
      .run(name, username, email, passwordHash);
    const user = {
      id: Number(result.lastInsertRowid),
      name,
      username,
      email,
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
      const field = /username/i.test(String(error.message)) ? "username" : "email";
      throw conflict(
        field === "username"
          ? "An account with that username already exists."
          : "An account with that email already exists.",
        { cause: error },
      );
    }
    return next(error);
  }
});

router.post("/login", async (request, response, next) => {
  const { email, username, password, details } = validateLogin(request.body);

  if (details.length > 0) {
    return response.status(400).json({
      error: "Provide a valid email or username and password.",
      code: "validation_error",
      details,
    });
  }

  try {
    const user = database
      .prepare(
        "SELECT id, name, username, email, password_hash, role FROM users WHERE email = ? OR username = ?",
      )
      .get(email || username, username || email);

    if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      throw unauthorized("Invalid email, username, or password.");
    }

    return authenticationResponse(response, user);
  } catch (error) {
    return next(error);
  }
});

export default router;
