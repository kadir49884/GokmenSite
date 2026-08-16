import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { DEFAULT_PRODUCTS } from './product-data.js';

/** Tum veri (urunler, talepler, ayarlar) tek JSON kaydinda tutulur. */
const LOCAL_FILE = path.join(process.cwd(), 'data', 'store.json');

if (process.env.VERCEL && !process.env.DATABASE_URL) {
  throw new Error('Veritabanı Vercel projesine bağlanmamış.');
}

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
let tableReady;

function initialData() {
  return {
    products: DEFAULT_PRODUCTS.map((product, index) => ({ id: index + 1, ...product })),
    requests: [],
    settings: {},
  };
}

export function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

async function ensureTable() {
  tableReady ??= sql`CREATE TABLE IF NOT EXISTS store (id INT PRIMARY KEY, data JSONB NOT NULL)`;
  await tableReady;
}

async function readSaved() {
  if (!sql) {
    return fs.existsSync(LOCAL_FILE) ? JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8')) : null;
  }
  await ensureTable();
  const rows = await sql`SELECT data FROM store WHERE id = 1`;
  return rows[0]?.data ?? null;
}

async function save(data) {
  if (!sql) {
    fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
    return;
  }
  await ensureTable();
  await sql`
    INSERT INTO store (id, data) VALUES (1, ${JSON.stringify(data)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`;
}

/** Kayitli veriyi getirir, ilk calistirmada varsayilan urunlerle olusturur. */
export async function readData() {
  const saved = await readSaved();
  if (saved) return saved;

  const data = initialData();
  await save(data);
  return data;
}

/** Veriyi okur, verilen fonksiyonla degistirir ve kaydeder. */
export async function updateData(change) {
  const data = await readData();
  const result = change(data);
  await save(data);
  return result;
}
