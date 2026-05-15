const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "..", "prisma", "dev.db");
const migrationsDir = path.join(__dirname, "..", "prisma", "migrations");

console.log("Setting up database at:", dbPath);

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'")
  .all()
  .map((r) => r.name);

if (tables.length > 0) {
  console.log("Database already initialized. Tables:", tables.join(", "));
  db.close();
  process.exit(0);
}

const migrationDirs = fs
  .readdirSync(migrationsDir)
  .filter((d) => fs.statSync(path.join(migrationsDir, d)).isDirectory())
  .sort();

for (const dir of migrationDirs) {
  const sqlFile = path.join(migrationsDir, dir, "migration.sql");
  if (!fs.existsSync(sqlFile)) continue;

  const sql = fs.readFileSync(sqlFile, "utf8");
  console.log("Applying migration:", dir);

  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    db.prepare(stmt + ";").run();
  }
}

const finalTables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  .all()
  .map((r) => r.name);

console.log("Database ready. Tables:", finalTables.join(", "));
db.close();
