import { randomUUID } from "node:crypto";

const unsafeCharacters = /[\u0000-\u001f\u007f]/g;
const requestIdPattern = /^[A-Za-z0-9._-]{1,64}$/;
const maxMethodLength = 16;
const maxPathLength = 512;

function sanitize(value, limit) {
  if (typeof value !== "string") {
    return "";
  }

  const cleaned = value.replace(unsafeCharacters, "");
  return cleaned.length > limit ? `${cleaned.slice(0, limit)}...` : cleaned;
}

function resolveRequestId(request) {
  const provided = request.get("x-request-id");

  if (typeof provided === "string" && requestIdPattern.test(provided)) {
    return provided;
  }

  return randomUUID();
}

function resolveRequestPath(request) {
  const url = request.originalUrl ?? request.url ?? "";
  return url.split("?", 1)[0];
}

function buildEntry(request, response, requestId, startedAt, aborted) {
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
  const entry = {
    requestId,
    method: sanitize(request.method, maxMethodLength),
    path: sanitize(resolveRequestPath(request), maxPathLength),
    status: response.statusCode,
    durationMs: Math.round(durationMs * 100) / 100,
  };

  if (request.user?.id !== undefined) {
    entry.userId = request.user.id;
  }

  if (aborted) {
    entry.aborted = true;
  }

  return entry;
}

// [SEC-07] API request logging
// Logs one line per request on completion: method, path, status, and duration.
// Request bodies, query strings, and headers are never logged, so passwords,
// Bearer tokens, and session data cannot reach the logs.
export default function requestLogger(options = {}) {
  const { enabled = process.env.LOG_REQUESTS !== "false" } = options;

  return function logRequest(request, response, next) {
    if (!enabled) {
      return next();
    }

    const requestId = resolveRequestId(request);
    const startedAt = process.hrtime.bigint();
    let logged = false;

    request.requestId = requestId;
    response.setHeader("x-request-id", requestId);

    function complete(aborted) {
      if (logged) {
        return;
      }

      logged = true;
      const entry = buildEntry(request, response, requestId, startedAt, aborted);

      if (entry.status >= 500) {
        console.error(`[request] ${JSON.stringify(entry)}`);
        return;
      }

      return console.log(`[request] ${JSON.stringify(entry)}`);
    }

    response.on("finish", () => complete(false));
    response.on("close", () => complete(!response.writableFinished));

    return next();
  };
}