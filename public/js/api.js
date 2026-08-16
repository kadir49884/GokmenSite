const TOKEN_KEY = 'bayram_admin_token';

export const adminToken = {
  get: () => localStorage.getItem(TOKEN_KEY) ?? '',
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error ?? 'Beklenmeyen bir hata oluştu.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = `Bearer ${adminToken.get()}`;

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return readResponse(response);
}

/** Dosya yuklemede govde FormData oldugu icin ayri tutulur. */
export async function upload(path, formData) {
  const response = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken.get()}` },
    body: formData,
  });
  return readResponse(response);
}

export const formatPrice = (value) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);

export const formatDate = (value) => new Date(value).toLocaleString('tr-TR');

export function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
}

export function showMessage(element, text, type = 'info') {
  element.className = `message ${type}`;
  element.textContent = text;
  element.classList.toggle('hidden', !text);
}
