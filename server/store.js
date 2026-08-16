import fs from 'node:fs';
import path from 'node:path';
import { get, put } from '@vercel/blob';
import { DEFAULT_PRODUCTS } from './product-data.js';

/** Tum veri (urunler, talepler, ayarlar) tek JSON dosyasinda tutulur. */
const BLOB_PATHNAME = 'data/store.json';
const LOCAL_FILE = path.join(process.cwd(), 'data', 'store.json');
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

if (process.env.VERCEL && !blobToken) {
  throw new Error('Vercel Blob deposu projeye bağlanmamış.');
}

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

async function readSaved() {
  if (!blobToken) {
    return fs.existsSync(LOCAL_FILE) ? JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8')) : null;
  }
  // useCache: false, panelde yapilan degisikligin vitrinde hemen gorunmesini saglar.
  const blob = await get(BLOB_PATHNAME, { access: 'public', useCache: false, token: blobToken });
  return blob ? JSON.parse(await new Response(blob.stream).text()) : null;
}

async function save(data) {
  const json = JSON.stringify(data, null, 2);
  if (!blobToken) {
    fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_FILE, json);
    return;
  }
  await put(BLOB_PATHNAME, json, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: blobToken,
  });
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
