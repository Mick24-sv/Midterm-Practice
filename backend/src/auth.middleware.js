import jwt from "jsonwebtoken";
import database from "./database.js";

export default function requireAuthentication(request, response, next) {
  const authorization = request.get("authorization");
  const match = typeof authorization === "string"
    ? /^Bearer ([^\s]+)$/i.exec(authorization)
    : null;

  if (!match) {
    return response.status(401).json({ error: "A valid Bearer token is required." });
  }

  try {
    const claims = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "mini-management-system",
      audience: "mini-management-system-api",
    });

    if (typeof claims === "string" || !/^\d+$/.test(claims.sub ?? "")) {
      return response.status(401).json({ error: "Invalid or expired token." });
    }

    const user = database
      .prepare("SELECT id FROM users WHERE id = ?")
      .get(Number(claims.sub));

    if (!user) {
      return response.status(401).json({ error: "Invalid or expired token." });
    }

    request.user = { id: user.id };
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return response.status(401).json({ error: "Invalid or expired token." });
    }
    return next(error);
  }
}
