# Mini Management System

## Backend

The backend is an Express API located in `backend/`. It requires Node.js 20 or newer.

```sh
cd backend
npm install
```

Copy `.env.example` to `.env` to customize the server port and SQLite database
path. The database file and its parent directory are created automatically.
Relative database paths are resolved from `backend/`. Set `JWT_SECRET` to a
random secret of at least 32 bytes before starting the API. Generate one with
`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`
from the `backend/` directory.

Start the API with:

```sh
npm run dev
```

The API listens on port `3000` by default and stores data in
`backend/data/mini-management.sqlite`. Verify it is running at
`http://localhost:3000/api/health`; the endpoint also checks the database
connection. On startup, the backend creates the `users` and `records` tables
and their indexes if they do not already exist. User registration stores a
bcrypt password hash and assigns the `user` role; existing accounts receive a
nullable password-hash column and a `user` role, and must register a new
account to use password login. To grant administrator access, run
`UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';` in a
trusted SQLite client. Roles are loaded from the database on each
authenticated request, so role changes take effect immediately. Never accept
role assignments from public registration.
Records may optionally belong to a user; deleting that user leaves the record
and clears its owner.
Use `npm start` to run the backend without the development watcher.

### Authentication API

- `POST /api/auth/register` accepts `{ "name": "Ada", "email": "ada@example.com", "password": "at-least-8-characters" }`. It returns `201` with the safe user profile and a one-hour Bearer JWT. Duplicate email addresses return `409`.
- `POST /api/auth/login` accepts `{ "email": "ada@example.com", "password": "at-least-8-characters" }`. It returns the same token response; invalid credentials return `401`.

Passwords must be 8–72 UTF-8 bytes. The API never returns password hashes.
Registration always assigns the `user` role, even if a role is included in
the request. Login and registration responses include the account role.
The backend rejects invalid field types, malformed email addresses, out-of-range
field lengths, malformed JSON (`400`), and JSON request bodies larger than
32 KB (`413`). Login passwords must meet the same 8–72-byte limits as
registration.

### Error Handling

All errors share one JSON shape: `{ "error": "...", "code": "..." }`. Validation
failures add a `details` array of `{ "field": "...", "message": "..." }` entries
so clients can highlight the offending inputs. Unexpected failures never expose
stack traces or database messages; they are logged server-side and returned as
`500` with `"An unexpected error occurred."`.

- `404 not_found` for any unmatched path, including unknown `/api` routes.
- `400 invalid_json` for malformed request bodies and `413 payload_too_large` for
  bodies over 32 KB.
- `400 validation_error` with per-field `details` for invalid registration,
  login, record, and search-query input. A non-object body returns
  `400 invalid_body`.
- `409 conflict` for duplicate email addresses and SQLite uniqueness conflicts.
- `401 unauthorized` when no Bearer token is supplied, and `401 invalid_token`
  for malformed, expired, or unknown-subject tokens.
- `503 service_unavailable` when `/api/health` cannot reach the database.
- SQLite check, not-null, and foreign-key violations map to `400` or `409`
  instead of surfacing as internal errors.

Run the error-handling checks with `npm test` from `backend/`.

### Request Logging

Every API request emits one structured line on completion, written to stdout:

```
[request] {"requestId":"...","method":"GET","path":"/api/records","status":200,"durationMs":1.42,"userId":1}
```

Each entry carries a `requestId`, the `method`, the path without its query
string, the response `status`, and the `durationMs` in milliseconds. Authenticated
requests also include `userId`, and requests closed by the client before a
response was sent are marked `"aborted": true`. Lines with a `5xx` status go to
stderr; everything else goes to stdout.

The `requestId` comes from an inbound `X-Request-Id` header when it matches
`[A-Za-z0-9._-]{1,64}`, otherwise a random UUID is generated. It is echoed back
as the `X-Request-Id` response header so a client can match a failure report to
its server log entry.

Bodies, query strings, and headers are never logged, so passwords, JWTs, and
search terms cannot leak into logs. Logged methods and paths are stripped of
control characters to prevent forged log lines, and paths are truncated at 512
characters. Set `LOG_REQUESTS=false` to disable request logging entirely.

### Records API

Users can list only their own records; admins can list records owned by any
user. New records are always owned by the authenticated account.

- `GET /api/records` requires `Authorization: Bearer <token>` and returns `{ "records": [...] }` containing only records owned by the authenticated user, newest first. An optional `q` parameter searches titles and descriptions (case-insensitive substring match), for example `/api/records?q=project`. `%` and `_` are treated as literal characters. The query must be at most 200 characters. An account with no matches receives an empty array. Missing or invalid tokens return `401`; invalid query parameters return `400`.
- `POST /api/records` requires `Authorization: Bearer <token>` and accepts `{ "title": "Example record", "description": "Details", "status": "active" }`. The title is required (up to 200 characters); description is optional (up to 5000 characters); status defaults to `active` and may be `active` or `archived`.
- It returns `201` with the created record. Ownership is taken from the authenticated account, not the request body. Missing or invalid tokens return `401`; invalid fields return `400`.

### Update Record API

- `PATCH /api/records/:id` requires `Authorization: Bearer <token>` and accepts any
  subset of `{ "title": "Renamed", "description": "New details", "status": "archived" }`.
  The id must be a positive integer. At least one updatable field is required.
- It returns `200` with the full updated record. Only the supplied fields change;
  omitted fields keep their stored values. `updated_at` is set to the current
  timestamp on every successful update, while `created_at` and `owner_id` never
  change. Owners cannot reassign ownership or alter `owner_id`.
- Owners may update their own records. Admins may update any record. Updating
  another user's record returns `403 forbidden`, an unknown id returns `404`, a
  malformed id or invalid fields return `400` with `details`, and a missing or
  invalid token returns `401`.