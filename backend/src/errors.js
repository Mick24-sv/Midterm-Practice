const defaultCodes = {
  400: "bad_request",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  413: "payload_too_large",
  500: "internal_server_error",
  503: "service_unavailable",
};

export class HttpError extends Error {
  constructor(status, message, options = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "HttpError";
    this.status = status;
    this.code = options.code ?? defaultCodes[status] ?? "error";
    this.details = options.details;
  }
}

export function badRequest(message, options) {
  return new HttpError(400, message, options);
}

export function unauthorized(message, options) {
  return new HttpError(401, message, options);
}

export function notFound(message, options) {
  return new HttpError(404, message, options);
}

export function conflict(message, options) {
  return new HttpError(409, message, options);
}

export function serviceUnavailable(message, options) {
  return new HttpError(503, message, options);
}

const sqliteConstraintStatuses = {
  SQLITE_CONSTRAINT_UNIQUE: { status: 409, code: "conflict", message: "That value is already taken." },
  SQLITE_CONSTRAINT_PRIMARYKEY: { status: 409, code: "conflict", message: "That value is already taken." },
  SQLITE_CONSTRAINT_FOREIGNKEY: { status: 409, code: "conflict", message: "A referenced record does not exist." },
  SQLITE_CONSTRAINT_CHECK: { status: 400, code: "validation_error", message: "The request failed a data integrity check." },
  SQLITE_CONSTRAINT_NOTNULL: { status: 400, code: "validation_error", message: "A required field was missing." },
  SQLITE_CONSTRAINT_TRIGGER: { status: 400, code: "validation_error", message: "The request failed a data integrity check." },
};

const bodyParserErrors = {
  "entity.parse.failed": { status: 400, code: "invalid_json", message: "Request body must contain valid JSON." },
  "entity.too.large": { status: 413, code: "payload_too_large", message: "Request body must not exceed 32 KB." },
  "encoding.unsupported": { status: 415, code: "unsupported_media_type", message: "Unsupported content encoding." },
  "charset.unsupported": { status: 415, code: "unsupported_media_type", message: "Unsupported character encoding." },
};

export function normalizeError(error) {
  if (error instanceof HttpError) {
    return error;
  }

  const bodyParserMatch = bodyParserErrors[error?.type];
  if (bodyParserMatch) {
    return new HttpError(bodyParserMatch.status, bodyParserMatch.message, { code: bodyParserMatch.code, cause: error });
  }

  const constraintMatch = typeof error?.code === "string" ? sqliteConstraintStatuses[error.code] : undefined;
  if (constraintMatch) {
    return new HttpError(constraintMatch.status, constraintMatch.message, { code: constraintMatch.code, cause: error });
  }

  if (error instanceof URIError) {
    return new HttpError(400, "Request URL contains invalid characters.", { code: "bad_request", cause: error });
  }

  return new HttpError(500, "An unexpected error occurred.", { code: "internal_server_error", cause: error });
}