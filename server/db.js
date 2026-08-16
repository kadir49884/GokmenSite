import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { DEFAULT_PRODUCTS } from './product-data.js';

if (process.env.VERCEL && (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN)) {
  throw new Error('Turso veritabanı Vercel projesine bağlanmamış.');
}

const databaseUrl = process.env.TURSO_DATABASE_URL || 'file:data/bayram.db';
if (databaseUrl.startsWith('file:')) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

export const db = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const SCHEMA = `
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
`;

/** Eski veritabanlarini veri kaybetmeden gunceller. */
async function addColumnIfMissing(table, column, definition) {
  const { rows: columns } = await db.execute(`PRAGMA table_info(${table})`);
  if (!columns.some((current) => current.name === column)) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function seedDefaultProducts() {
  const statements = DEFAULT_PRODUCTS.map((product) => ({
    sql: `INSERT OR IGNORE INTO products
      (code, name, category, description, price, in_stock, images, fabrics, sizes, colors, sleeves, closures)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      product.code,
      product.name,
      product.category,
      product.description,
      product.price,
      product.inStock ? 1 : 0,
      JSON.stringify(product.images),
      JSON.stringify(product.fabrics),
      JSON.stringify(product.sizes),
      JSON.stringify(product.colors),
      JSON.stringify(product.sleeves),
      JSON.stringify(product.closures),
    ],
  }));
  await db.batch(statements, 'write');
}

async function initializeDatabase() {
  await db.executeMultiple(SCHEMA);
  await addColumnIfMissing('products', 'category', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing('products', 'description', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing('products', 'images', "TEXT NOT NULL DEFAULT '[]'");
  await seedDefaultProducts();
}

export const databaseReady = initializeDatabase();
