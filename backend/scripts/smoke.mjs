import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";

const databasePath = resolve("data/smoke.sqlite");
rmSync(databasePath, { force: true });
rmSync(`${databasePath}-wal`, { force: true });
rmSync(`${databasePath}-shm`, { force: true });

process.env.DATABASE_PATH = "./data/smoke.sqlite";
process.env.JWT_SECRET = "a".repeat(64);

const { default: app } = await import("../src/app.js");

const server = createServer(app);
await new Promise((done) => server.listen(0, done));
const base = `http://127.0.0.1:${server.address().port}`;

let passed = 0;
async function check(label, run) {
  await run();
  passed += 1;
  console.log(`ok - ${label}`);
}

async function call(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...options.headers },
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : undefined };
}

let token;

await check("404 for unknown endpoint", async () => {
  const result = await call("/api/does-not-exist");
  assert.equal(result.status, 404);
  assert.equal(result.body.code, "not_found");
});

await check("404 for unknown root path", async () => {
  const result = await call("/totally/unknown");
  assert.equal(result.status, 404);
});

await check("400 for malformed JSON", async () => {
  const response = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{ not json",
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.code, "invalid_json");
  assert.equal(body.error, "Request body must contain valid JSON.");
});

await check("413 for oversized body", async () => {
  const result = await call("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "a@b.co", password: "x".repeat(40_000) }),
  });
  assert.equal(result.status, 413);
  assert.equal(result.body.code, "payload_too_large");
});

await check("400 with field details for invalid registration", async () => {
  const result = await call("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "", email: "nope", password: "short" }),
  });
  assert.equal(result.status, 400);
  assert.equal(result.body.code, "validation_error");
  assert.deepEqual(
    result.body.details.map((entry) => entry.field).sort(),
    ["email", "name", "password"],
  );
});

await check("400 for non-object registration body", async () => {
  const result = await call("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(["array"]),
  });
  assert.equal(result.status, 400);
  assert.equal(result.body.code, "invalid_body");
});

await check("201 on valid registration", async () => {
  const result = await call("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Ada",
      email: "ada@example.com",
      password: "at-least-8-characters",
      role: "admin",
    }),
  });
  assert.equal(result.status, 201);
  assert.equal(result.body.user.role, "user", "registration must never grant admin");
  token = result.body.token;
});

await check("409 for duplicate email", async () => {
  const result = await call("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Ada", email: "ADA@example.com", password: "at-least-8-characters" }),
  });
  assert.equal(result.status, 409);
  assert.equal(result.body.code, "conflict");
});

await check("401 for wrong password", async () => {
  const result = await call("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "ada@example.com", password: "wrong-password" }),
  });
  assert.equal(result.status, 401);
});

await check("200 on valid login", async () => {
  const result = await call("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "ada@example.com", password: "at-least-8-characters" }),
  });
  assert.equal(result.status, 200);
  assert.ok(result.body.token);
});

await check("401 without token on records", async () => {
  const result = await call("/api/records");
  assert.equal(result.status, 401);
  assert.equal(result.body.code, "unauthorized");
});

await check("401 with malformed token", async () => {
  const result = await call("/api/records", { headers: { authorization: "Bearer not-a-jwt" } });
  assert.equal(result.status, 401);
  assert.equal(result.body.code, "invalid_token");
});

await check("401 with non-numeric token subject", async () => {
  const { default: jwt } = await import("jsonwebtoken");
  const forged = jwt.sign({ email: "x" }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    subject: "abc",
    issuer: "mini-management-system",
    audience: "mini-management-system-api",
    expiresIn: 3600,
  });
  const result = await call("/api/records", { headers: { authorization: `Bearer ${forged}` } });
  assert.equal(result.status, 401);
});

await check("400 with details for invalid record", async () => {
  const result = await call("/api/records", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "  ", description: 12, status: "weird" }),
  });
  assert.equal(result.status, 400);
  assert.deepEqual(
    result.body.details.map((entry) => entry.field).sort(),
    ["description", "status", "title"],
  );
});

await check("201 on valid record", async () => {
  const result = await call("/api/records", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "Project", description: "Details" }),
  });
  assert.equal(result.status, 201);
  assert.equal(result.body.record.status, "active");
});

await check("200 listing records", async () => {
  const result = await call("/api/records", { headers: { authorization: `Bearer ${token}` } });
  assert.equal(result.status, 200);
  assert.equal(result.body.records.length, 1);
});

await check("400 for oversized search query", async () => {
  const result = await call(`/api/records?q=${"x".repeat(201)}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(result.status, 400);
  assert.equal(result.body.code, "validation_error");
});

await check("400 for non-numeric record id on update", async () => {
  const result = await call("/api/records/abc", {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "New" }),
  });
  assert.equal(result.status, 400);
  assert.equal(result.body.code, "validation_error");
  assert.equal(result.body.details[0].field, "id");
});

await check("404 for missing record on update", async () => {
  const result = await call("/api/records/999999", {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "New" }),
  });
  assert.equal(result.status, 404);
  assert.equal(result.body.code, "not_found");
});

await check("400 for empty update body", async () => {
  const result = await call("/api/records/1", {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
  assert.equal(result.status, 400);
  assert.equal(result.body.details[0].field, "body");
});

await check("400 with details for invalid partial update", async () => {
  const result = await call("/api/records/1", {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "   ", description: 5, status: "nope" }),
  });
  assert.equal(result.status, 400);
  assert.deepEqual(
    result.body.details.map((entry) => entry.field).sort(),
    ["description", "status", "title"],
  );
});

await check("401 for update without token", async () => {
  const result = await call("/api/records/1", {
    method: "PATCH",
    body: JSON.stringify({ title: "New" }),
  });
  assert.equal(result.status, 401);
});

await check("200 update applies partial fields", async () => {
  const result = await call("/api/records/1", {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "Renamed", status: "archived" }),
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.record.title, "Renamed");
  assert.equal(result.body.record.status, "archived");
  assert.equal(result.body.record.description, "Details", "untouched fields must persist");
  assert.equal(result.body.record.owner_id, 1, "ownership must not change");
});

await check("403 updating another user's record", async () => {
  const created = await call("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Bob", email: "bob@example.com", password: "another-pass-1" }),
  });
  const otherToken = created.body.token;

  const result = await call("/api/records/1", {
    method: "PATCH",
    headers: { authorization: `Bearer ${otherToken}` },
    body: JSON.stringify({ title: "Hijacked" }),
  });
  assert.equal(result.status, 403);
  assert.equal(result.body.code, "forbidden");
});

await check("admin can update another user's record", async () => {
  const admin = await call("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Root", email: "root@example.com", password: "admin-pass-1" }),
  });
  const adminToken = admin.body.token;

  const { default: database } = await import("../src/database.js");
  database
    .prepare("UPDATE users SET role = 'admin' WHERE email = ?")
    .run("root@example.com");

  const result = await call("/api/records/1", {
    method: "PATCH",
    headers: { authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ description: "Admin edit" }),
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.record.description, "Admin edit");
  assert.equal(result.body.record.title, "Renamed", "admin partial update must not clear fields");
});

await check("update bumps updated_at", async () => {
  const before = await call("/api/records", { headers: { authorization: `Bearer ${token}` } });
  await new Promise((done) => setTimeout(done, 1100));
  await call("/api/records/1", {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "Touched" }),
  });
  const after = await call("/api/records", { headers: { authorization: `Bearer ${token}` } });

  assert.notEqual(before.body.records[0].updated_at, after.body.records[0].updated_at);
  assert.equal(after.body.records[0].created_at, before.body.records[0].created_at);
});

await check("200 health", async () => {
  const result = await call("/api/health");
  assert.equal(result.status, 200);
  assert.equal(result.body.status, "ok");
});

await check("500 hides internals for unexpected errors", async () => {
  const { default: express } = await import("express");
  const { errorHandler } = await import("../src/error.middleware.js");
  const crashy = express();
  crashy.get("/boom", () => {
    throw new Error("secret connection string leaked");
  });
  crashy.use(errorHandler);

  const crashServer = createServer(crashy);
  await new Promise((done) => crashServer.listen(0, done));
  const res = await fetch(`http://127.0.0.1:${crashServer.address().port}/boom`);
  const body = await res.json();

  assert.equal(res.status, 500);
  assert.equal(body.code, "internal_server_error");
  assert.equal(body.error, "An unexpected error occurred.");
  assert.ok(!JSON.stringify(body).includes("secret connection string"));
  await new Promise((done) => crashServer.close(done));
});

await check("401 body has no token internals", async () => {
  const result = await call("/api/records", { headers: { authorization: "Bearer not-a-jwt" } });
  assert.equal(result.status, 401);
  assert.equal(result.body.error, "Invalid or expired token.");
});

await new Promise((done) => server.close(done));

const { default: database } = await import("../src/database.js");
database.close();

rmSync(databasePath, { force: true });
rmSync(`${databasePath}-wal`, { force: true });
rmSync(`${databasePath}-shm`, { force: true });

console.log(`\n${passed} checks passed`);