import { badRequest, notFound } from './http-error.js';
import { getProduct } from './products.js';
import { nextId, updateData, readData } from './store.js';

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
  return updateData((data) => {
    const created = {
      id: nextId(data.requests),
      ...request,
      status: 'yeni',
      created_at: new Date().toISOString(),
    };
    data.requests.push(created);
    return created;
  });
}

export async function listRequests({ status = '' } = {}) {
  const { products, requests } = await readData();
  const wanted = status.trim();

  return requests
    .filter((request) => !wanted || request.status === wanted)
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
    .map((request) => {
      const product = products.find((item) => item.id === request.product_id);
      return {
        ...request,
        product_code: product?.code ?? '',
        product_name: product?.name ?? 'Silinmiş ürün',
      };
    });
}

export async function updateRequestStatus(id, status) {
  if (!REQUEST_STATUSES.includes(status)) throw badRequest('Geçersiz talep durumu.');

  return updateData((data) => {
    const request = data.requests.find((item) => item.id === id);
    if (!request) return false;

    request.status = status;
    return true;
  });
}

export async function deleteRequest(id) {
  return updateData((data) => {
    const remaining = data.requests.filter((request) => request.id !== id);
    if (remaining.length === data.requests.length) return false;

    data.requests = remaining;
    return true;
  });
}
