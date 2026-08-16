import { badRequest } from './http-error.js';
import { nextId, readData, updateData } from './store.js';

/** Urunde liste olarak tutulan alanlar. */
const LIST_FIELDS = ['images', 'fabrics', 'sizes', 'colors', 'sleeves', 'closures'];

/** Hem dizi hem "Siyah, Beyaz" biçimindeki girdiyi temiz bir diziye çevirir. */
function toList(value) {
  const items = Array.isArray(value) ? value : String(value ?? '').split(',');
  return items.map((item) => String(item).trim()).filter(Boolean);
}

const byCode = (a, b) => a.code.localeCompare(b.code, 'tr', { numeric: true });

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
    inStock: Boolean(body.inStock),
  };
  for (const field of LIST_FIELDS) product[field] = toList(body[field]);
  return product;
}

export async function listProducts({ search = '', category = '', onlyInStock = false } = {}) {
  const { products } = await readData();
  const term = search.trim().toLocaleLowerCase('tr');
  const wanted = category.trim();

  return products
    .filter((product) => !term || `${product.code} ${product.name}`.toLocaleLowerCase('tr').includes(term))
    .filter((product) => !wanted || product.category === wanted)
    .filter((product) => !onlyInStock || product.inStock)
    .sort(byCode);
}

export async function listCategories() {
  const { products } = await readData();
  const categories = new Set(products.map((product) => product.category).filter(Boolean));
  return [...categories].sort((a, b) => a.localeCompare(b, 'tr'));
}

export async function getProduct(id) {
  const { products } = await readData();
  return products.find((product) => product.id === id) ?? null;
}

export async function createProduct(product) {
  return updateData((data) => {
    if (data.products.some((current) => current.code === product.code)) {
      throw badRequest('Bu ürün kodu zaten kayıtlı.');
    }
    const created = { id: nextId(data.products), ...product };
    data.products.push(created);
    return created;
  });
}

export async function updateProduct(id, product) {
  return updateData((data) => {
    const current = data.products.find((item) => item.id === id);
    if (!current) return null;
    if (data.products.some((item) => item.code === product.code && item.id !== id)) {
      throw badRequest('Bu ürün kodu başka bir üründe kullanılıyor.');
    }
    Object.assign(current, product);
    return current;
  });
}

export async function deleteProduct(id) {
  return updateData((data) => {
    const remaining = data.products.filter((product) => product.id !== id);
    if (remaining.length === data.products.length) return false;

    data.products = remaining;
    data.requests = data.requests.filter((request) => request.product_id !== id);
    return true;
  });
}
