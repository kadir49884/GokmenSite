import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'bayram.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    category    TEXT    NOT NULL DEFAULT '',
    description TEXT    NOT NULL DEFAULT '',
    price       REAL    NOT NULL DEFAULT 0,
    in_stock    INTEGER NOT NULL DEFAULT 1,
    images      TEXT    NOT NULL DEFAULT '[]',
    fabrics     TEXT    NOT NULL DEFAULT '[]',
    sizes       TEXT    NOT NULL DEFAULT '[]',
    colors      TEXT    NOT NULL DEFAULT '[]',
    sleeves     TEXT    NOT NULL DEFAULT '[]',
    closures    TEXT    NOT NULL DEFAULT '[]',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS requests (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_name TEXT    NOT NULL,
    phone         TEXT    NOT NULL,
    fabric        TEXT    NOT NULL DEFAULT '',
    size          TEXT    NOT NULL DEFAULT '',
    color         TEXT    NOT NULL DEFAULT '',
    sleeve        TEXT    NOT NULL DEFAULT '',
    closure       TEXT    NOT NULL DEFAULT '',
    quantity      INTEGER NOT NULL DEFAULT 1,
    note          TEXT    NOT NULL DEFAULT '',
    status        TEXT    NOT NULL DEFAULT 'yeni',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );
`);

/** Eski veritabanlarini veri kaybetmeden gunceller. */
function addColumnIfMissing(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((current) => current.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

addColumnIfMissing('products', 'category', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('products', 'description', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('products', 'images', "TEXT NOT NULL DEFAULT '[]'");
