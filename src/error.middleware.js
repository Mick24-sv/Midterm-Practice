import { normalizeError } from "./errors.js";

const sensitiveCodes = new Set(["internal_server_error", "service_unavailable"]);

export function notFoundHandler(request, response) {
  response.status(404).json({
    error: "The requested endpoint does not exist.",
    code: "not_found",
  });
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  const normalized = normalizeError(error);

  if (normalized.status >= 500) {
    console.error(
      `[error] ${request.method} ${request.originalUrl} -> ${normalized.status}`,
      normalized.cause ?? normalized,
    );
  }

  const body = {
    error: normalized.message,
    code: normalized.code,
  };

  if (normalized.details !== undefined && !sensitiveCodes.has(normalized.code)) {
    body.details = normalized.details;
  }

  return response.status(normalized.status).json(body);
}