import { databaseReady, db } from './db.js';
import { badRequest } from './http-error.js';

/** Veritabaninda JSON dizi olarak tutulan alanlar. */
const LIST_FIELDS = ['images', 'fabrics', 'sizes', 'colors', 'sleeves', 'closures'];

/** Hem dizi hem "Siyah, Beyaz" biçimindeki girdiyi temiz bir diziye çevirir. */
function toList(value) {
  const items = Array.isArray(value) ? value : String(value ?? '').split(',');
  return items.map((item) => String(item).trim()).filter(Boolean);
}

function toProduct(row) {
  if (!row) return null;
  const product = { ...row, inStock: row.in_stock === 1 };
  delete product.in_stock;
  for (const field of LIST_FIELDS) product[field] = JSON.parse(row[field]);
  return product;
}

export function validateProduct(body) {
  const code = String(body.code ?? '').trim();
  const name = String(body.name ?? '').trim();
  const price = Number(body.price);

  if (!code) throw badRequest('Ürün kodu zorunludur.');
  if (!name) throw badRequest('Ürün bilgisi zorunludur.');
  if (!Number.isFinite(price) || price < 0) throw badRequest('Fiyat geçerli bir sayı olmalıdır.');

  const product = {
    code,
    name,
    category: String(body.category ?? '').trim(),
    description: String(body.description ?? '').trim(),
    price,
    in_stock: body.inStock ? 1 : 0,
  };
  for (const field of LIST_FIELDS) product[field] = JSON.stringify(toList(body[field]));
  return product;
}

export async function listProducts({ search = '', category = '', onlyInStock = false } = {}) {
  await databaseReady;
  const query = `%${search.trim()}%`;
  const { rows } = await db.execute({
    sql: `SELECT * FROM products
      WHERE (code LIKE ? OR name LIKE ?)
        AND (? = '' OR category = ?)
        AND (? = 0 OR in_stock = 1)
      ORDER BY code`,
    args: [query, query, category.trim(), category.trim(), onlyInStock ? 1 : 0],
  });
  return rows.map(toProduct);
}

export async function listCategories() {
  await databaseReady;
  const { rows } = await db.execute(
    "SELECT DISTINCT category FROM products WHERE category <> '' ORDER BY category",
  );
  return rows.map((row) => row.category);
}

export async function getProduct(id) {
  await databaseReady;
  const { rows } = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
  return toProduct(rows[0]);
}

export async function createProduct(product) {
  await databaseReady;
  const existing = await db.execute({ sql: 'SELECT 1 FROM products WHERE code = ?', args: [product.code] });
  if (existing.rows.length > 0) {
    throw badRequest('Bu ürün kodu zaten kayıtlı.');
  }
  const result = await db.execute({
    sql: `INSERT INTO products
      (code, name, category, description, price, in_stock, images, fabrics, sizes, colors, sleeves, closures)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      product.code,
      product.name,
      product.category,
      product.description,
      product.price,
      product.in_stock,
      product.images,
      product.fabrics,
      product.sizes,
      product.colors,
      product.sleeves,
      product.closures,
    ],
  });
  return getProduct(Number(result.lastInsertRowid));
}

export async function updateProduct(id, product) {
  await databaseReady;
  const conflict = await db.execute({
    sql: 'SELECT 1 FROM products WHERE code = ? AND id <> ?',
    args: [product.code, id],
  });
  if (conflict.rows.length > 0) throw badRequest('Bu ürün kodu başka bir üründe kullanılıyor.');

  const result = await db.execute({
    sql: `UPDATE products SET code = ?, name = ?, category = ?, description = ?,
      price = ?, in_stock = ?, images = ?, fabrics = ?, sizes = ?, colors = ?, sleeves = ?, closures = ?
      WHERE id = ?`,
    args: [
      product.code,
      product.name,
      product.category,
      product.description,
      product.price,
      product.in_stock,
      product.images,
      product.fabrics,
      product.sizes,
      product.colors,
      product.sleeves,
      product.closures,
      id,
    ],
  });
  return result.rowsAffected > 0 ? getProduct(id) : null;
}

export async function deleteProduct(id) {
  await databaseReady;
  const result = await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] });
  return result.rowsAffected > 0;
}
