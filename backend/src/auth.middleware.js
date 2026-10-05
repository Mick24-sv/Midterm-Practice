import jwt from "jsonwebtoken";
import database from "./database.js";
import { unauthorized } from "./errors.js";

export default function requireAuthentication(request, response, next) {
  const authorization = request.get("authorization");
  const match = typeof authorization === "string"
    ? /^Bearer ([^\s]+)$/i.exec(authorization)
    : null;

  if (!match) {
    throw unauthorized("A valid Bearer token is required.");
  }

  try {
    const claims = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "mini-management-system",
      audience: "mini-management-system-api",
    });

    if (typeof claims === "string" || !/^\d+$/.test(claims.sub ?? "")) {
      throw unauthorized("Invalid or expired token.", { code: "invalid_token" });
    }

    const user = database
      .prepare("SELECT id, role FROM users WHERE id = ?")
      .get(Number(claims.sub));

    if (!user) {
      throw unauthorized("Invalid or expired token.", { code: "invalid_token" });
    }

    request.user = { id: user.id, role: user.role };
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      throw unauthorized("Invalid or expired token.", { code: "invalid_token", cause: error });
    }
    throw error;
  }
}