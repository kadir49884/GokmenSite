import { db } from './db.js';
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

export function listProducts({ search = '', category = '', onlyInStock = false } = {}) {
  const rows = db
    .prepare(
      `SELECT * FROM products
       WHERE (code LIKE @q OR name LIKE @q)
         AND (@category = '' OR category = @category)
         AND (@onlyInStock = 0 OR in_stock = 1)
       ORDER BY code`,
    )
    .all({ q: `%${search.trim()}%`, category: category.trim(), onlyInStock: onlyInStock ? 1 : 0 });
  return rows.map(toProduct);
}

export function listCategories() {
  return db
    .prepare("SELECT DISTINCT category FROM products WHERE category <> '' ORDER BY category")
    .all()
    .map((row) => row.category);
}

export function getProduct(id) {
  return toProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id));
}

export function createProduct(product) {
  if (db.prepare('SELECT 1 FROM products WHERE code = ?').get(product.code)) {
    throw badRequest('Bu ürün kodu zaten kayıtlı.');
  }
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO products
         (code, name, category, description, price, in_stock, images, fabrics, sizes, colors, sleeves, closures)
       VALUES
         (@code, @name, @category, @description, @price, @in_stock, @images, @fabrics, @sizes, @colors, @sleeves, @closures)`,
    )
    .run(product);
  return getProduct(lastInsertRowid);
}

export function updateProduct(id, product) {
  const conflict = db.prepare('SELECT 1 FROM products WHERE code = ? AND id <> ?').get(product.code, id);
  if (conflict) throw badRequest('Bu ürün kodu başka bir üründe kullanılıyor.');

  const { changes } = db
    .prepare(
      `UPDATE products SET code = @code, name = @name, category = @category, description = @description,
         price = @price, in_stock = @in_stock, images = @images, fabrics = @fabrics, sizes = @sizes,
         colors = @colors, sleeves = @sleeves, closures = @closures
       WHERE id = @id`,
    )
    .run({ ...product, id });
  return changes ? getProduct(id) : null;
}

export function deleteProduct(id) {
  return db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0;
}
