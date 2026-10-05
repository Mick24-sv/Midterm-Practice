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

### Records API

Users can list only their own records; admins can list records owned by any
user. New records are always owned by the authenticated account.

- `GET /api/records` requires `Authorization: Bearer <token>` and returns `{ "records": [...] }` containing only records owned by the authenticated user, newest first. An optional `q` parameter searches titles and descriptions (case-insensitive substring match), for example `/api/records?q=project`. `%` and `_` are treated as literal characters. The query must be at most 200 characters. An account with no matches receives an empty array. Missing or invalid tokens return `401`; invalid query parameters return `400`.
- `POST /api/records` requires `Authorization: Bearer <token>` and accepts `{ "title": "Example record", "description": "Details", "status": "active" }`. The title is required (up to 200 characters); description is optional (up to 5000 characters); status defaults to `active` and may be `active` or `archived`.
- It returns `201` with the created record. Ownership is taken from the authenticated account, not the request body. Missing or invalid tokens return `401`; invalid fields return `400`.