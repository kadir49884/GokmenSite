import { databaseReady, db } from './db.js';
import { badRequest, notFound } from './http-error.js';
import { getProduct } from './products.js';

export const REQUEST_STATUSES = ['yeni', 'islemde', 'tamamlandi'];

/** Talep alanı -> ürünün seçenek listesi ve kullanıcıya gösterilecek etiket. */
const OPTION_FIELDS = {
  fabric: { source: 'fabrics', label: 'Kumaş tipi' },
  size: { source: 'sizes', label: 'Beden' },
  color: { source: 'colors', label: 'Renk' },
  sleeve: { source: 'sleeves', label: 'Kol tipi' },
  closure: { source: 'closures', label: 'Kapanma şekli' },
};

export async function validateRequest(body) {
  const product = await getProduct(Number(body.productId));
  if (!product) throw notFound('Ürün bulunamadı.');

  const customerName = String(body.customerName ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const quantity = Number(body.quantity ?? 1);

  if (customerName.length < 3) throw badRequest('Ad soyad en az 3 karakter olmalıdır.');
  if (phone.length < 7) throw badRequest('Geçerli bir telefon numarası giriniz.');
  if (!Number.isInteger(quantity) || quantity < 1) throw badRequest('Adet en az 1 olmalıdır.');

  const request = {
    product_id: product.id,
    customer_name: customerName,
    phone,
    quantity,
    note: String(body.note ?? '').trim(),
  };

  for (const [field, { source, label }] of Object.entries(OPTION_FIELDS)) {
    const options = product[source];
    const value = String(body[field] ?? '').trim();
    if (options.length > 0) {
      if (!value) throw badRequest(`${label} seçiniz.`);
      if (!options.includes(value)) throw badRequest(`${label} seçimi geçersiz.`);
    }
    request[field] = value;
  }
  return request;
}

export async function createRequest(request) {
  await databaseReady;
  const result = await db.execute({
    sql: `INSERT INTO requests
      (product_id, customer_name, phone, fabric, size, color, sleeve, closure, quantity, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      request.product_id,
      request.customer_name,
      request.phone,
      request.fabric,
      request.size,
      request.color,
      request.sleeve,
      request.closure,
      request.quantity,
      request.note,
    ],
  });
  const created = await db.execute({
    sql: 'SELECT * FROM requests WHERE id = ?',
    args: [Number(result.lastInsertRowid)],
  });
  return created.rows[0];
}

export async function listRequests({ status = '' } = {}) {
  await databaseReady;
  const value = status.trim();
  const { rows } = await db.execute({
    sql: `SELECT r.*, p.code AS product_code, p.name AS product_name
      FROM requests r JOIN products p ON p.id = r.product_id
      WHERE ? = '' OR r.status = ?
      ORDER BY r.created_at DESC, r.id DESC`,
    args: [value, value],
  });
  return rows;
}

export async function updateRequestStatus(id, status) {
  if (!REQUEST_STATUSES.includes(status)) throw badRequest('Geçersiz talep durumu.');
  await databaseReady;
  const result = await db.execute({
    sql: 'UPDATE requests SET status = ? WHERE id = ?',
    args: [status, id],
  });
  return result.rowsAffected > 0;
}

export async function deleteRequest(id) {
  await databaseReady;
  const result = await db.execute({ sql: 'DELETE FROM requests WHERE id = ?', args: [id] });
  return result.rowsAffected > 0;
}
