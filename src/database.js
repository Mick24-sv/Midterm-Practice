import "dotenv/config";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const backendDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const databasePath = resolve(
  backendDirectory,
  process.env.DATABASE_PATH ?? "data/mini-management.sqlite",
);

mkdirSync(dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma("foreign_keys = ON");
database.pragma("journal_mode = WAL");
database.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));

const userColumns = database.pragma("table_info(users)");
if (!userColumns.some((column) => column.name === "password_hash")) {
  database.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
}
if (!userColumns.some((column) => column.name === "role")) {
  database.exec(
    "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user'))",
  );
}

export default database;
