import { adminToken, api, escapeHtml, formatDate, formatPrice, showMessage, upload } from './api.js';
import { site } from './layout.js';
import { OPTION_GROUPS } from './options.js';

const STATUS_LABELS = { yeni: 'Yeni', islemde: 'İşlemde', tamamlandi: 'Tamamlandı' };

const REQUEST_OPTION_LABELS = [
  ['fabric', 'Kumaş'],
  ['size', 'Beden'],
  ['color', 'Renk'],
  ['sleeve', 'Kol'],
  ['closure', 'Kapanma'],
];

const SETTING_FIELDS = ['companyName', 'slogan', 'about', 'phone', 'whatsapp', 'email', 'address', 'workingHours'];

const el = {
  loginView: document.querySelector('#login-view'),
  loginForm: document.querySelector('#login-form'),
  password: document.querySelector('#password'),
  loginMessage: document.querySelector('#login-message'),
  panelView: document.querySelector('#panel-view'),
  panelMessage: document.querySelector('#panel-message'),
  logout: document.querySelector('#logout'),
  tabs: document.querySelectorAll('.tabs button'),
  tabProducts: document.querySelector('#tab-products'),
  tabRequests: document.querySelector('#tab-requests'),
  tabSettings: document.querySelector('#tab-settings'),
  requestTabButton: document.querySelector('[data-tab="requests"]'),
  productForm: document.querySelector('#product-form'),
  productFormTitle: document.querySelector('#product-form-title'),
  productFormReset: document.querySelector('#product-form-reset'),
  productRows: document.querySelector('#product-rows'),
  categoryList: document.querySelector('#category-list'),
  imagesInput: document.querySelector('#images'),
  imageFile: document.querySelector('#image-file'),
  uploadButton: document.querySelector('#upload-button'),
  imagePreview: document.querySelector('#image-preview'),
  requestRows: document.querySelector('#request-rows'),
  statusFilter: document.querySelector('#status-filter'),
  settingsForm: document.querySelector('#settings-form'),
};

let products = [];
let editingProductId = null;

/* ---------- Oturum ---------- */

function showPanel(isLoggedIn) {
  el.loginView.classList.toggle('hidden', isLoggedIn);
  el.panelView.classList.toggle('hidden', !isLoggedIn);
  el.logout.classList.toggle('hidden', !isLoggedIn);
}

function signOut(message = '') {
  adminToken.clear();
  showPanel(false);
  showMessage(el.loginMessage, message, message ? 'error' : 'info');
}

/** Yetki hatasinda oturumu kapatir, diger hatalari panelde gosterir. */
async function guard(action) {
  try {
    await action();
  } catch (error) {
    if (error.status === 401) signOut('Oturum süresi doldu, tekrar giriş yapın.');
    else showMessage(el.panelMessage, error.message, 'error');
  }
}

el.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const { token } = await api('/admin/login', { method: 'POST', body: { password: el.password.value } });
    adminToken.set(token);
    el.loginForm.reset();
    showMessage(el.loginMessage, '');
    start();
  } catch (error) {
    showMessage(el.loginMessage, error.message, 'error');
  }
});

el.logout.addEventListener('click', async () => {
  await api('/admin/logout', { method: 'POST', auth: true }).catch(() => {});
  signOut();
});

/* ---------- Sekmeler ---------- */

el.tabs.forEach((button) => {
  button.addEventListener('click', () => {
    const { tab } = button.dataset;
    el.tabs.forEach((other) => other.classList.toggle('active', other === button));
    el.tabProducts.classList.toggle('hidden', tab !== 'products');
    el.tabRequests.classList.toggle('hidden', tab !== 'requests');
    el.tabSettings.classList.toggle('hidden', tab !== 'settings');

    if (tab === 'products') loadProducts();
    if (tab === 'requests') loadRequests();
  });
});

/* ---------- Ürün görselleri ---------- */

function renderImagePreview() {
  const sources = el.imagesInput.value
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  el.imagePreview.innerHTML = sources
    .map((source) => `<span class="thumb-button"><img src="${escapeHtml(source)}" alt="" /></span>`)
    .join('');
}

el.imagesInput.addEventListener('input', renderImagePreview);

el.uploadButton.addEventListener('click', () => {
  const [file] = el.imageFile.files;
  if (!file) {
    showMessage(el.panelMessage, 'Önce bilgisayarınızdan bir görsel seçin.', 'error');
    return;
  }

  guard(async () => {
    const body = new FormData();
    body.append('image', file);
    const { url } = await upload('/uploads', body);

    const current = el.imagesInput.value.trim();
    el.imagesInput.value = current ? `${current}, ${url}` : url;
    el.imageFile.value = '';
    renderImagePreview();
    showMessage(el.panelMessage, 'Görsel yüklendi ve ürüne eklendi.', 'success');
  });
});

/* ---------- Ürünler ---------- */

function optionsSummary(product) {
  return OPTION_GROUPS.filter((group) => product[group.field].length > 0)
    .map((group) => `${group.label}: ${escapeHtml(product[group.field].join(', '))}`)
    .join('<br />');
}

function productRow(product) {
  const stockClass = product.inStock ? 'in-stock' : 'out-of-stock';
  const stockText = product.inStock ? 'Mevcut' : 'Mevcut Değil';
  const [cover] = product.images;
  const category = product.category ? `<br /><span class="hint">${escapeHtml(product.category)}</span>` : '';

  return `
    <tr>
      <td>${cover ? `<img class="row-thumb" src="${escapeHtml(cover)}" alt="" loading="lazy" />` : ''}</td>
      <td>${escapeHtml(product.code)}</td>
      <td>${escapeHtml(product.name)}${category}</td>
      <td>${formatPrice(product.price)}</td>
      <td><span class="badge ${stockClass}">${stockText}</span></td>
      <td>${optionsSummary(product)}</td>
      <td>
        <div class="actions">
          <button type="button" class="secondary" data-edit="${product.id}">Düzenle</button>
          <button type="button" class="danger" data-delete="${product.id}">Sil</button>
        </div>
      </td>
    </tr>`;
}

function renderCategorySuggestions() {
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
  el.categoryList.innerHTML = categories.map((category) => `<option value="${escapeHtml(category)}"></option>`).join('');
}

async function loadProducts() {
  await guard(async () => {
    products = await api('/products');
    el.productRows.innerHTML = products.length
      ? products.map(productRow).join('')
      : '<tr><td colspan="7" class="empty">Henüz ürün eklenmedi.</td></tr>';
    renderCategorySuggestions();
  });
}

function readProductForm() {
  const data = new FormData(el.productForm);
  const product = {
    code: data.get('code'),
    name: data.get('name'),
    category: data.get('category'),
    description: data.get('description'),
    price: Number(data.get('price')),
    images: data.get('images'),
    inStock: el.productForm.elements.inStock.checked,
  };
  for (const { field } of OPTION_GROUPS) product[field] = data.get(field);
  return product;
}

function resetProductForm() {
  el.productForm.reset();
  el.imageFile.value = '';
  renderImagePreview();
  editingProductId = null;
  el.productFormTitle.textContent = 'Yeni Ürün Ekle';
  el.productFormReset.classList.add('hidden');
}

function fillProductForm(product) {
  const fields = el.productForm.elements;
  fields.code.value = product.code;
  fields.name.value = product.name;
  fields.category.value = product.category;
  fields.description.value = product.description;
  fields.price.value = product.price;
  fields.images.value = product.images.join(', ');
  fields.inStock.checked = product.inStock;
  for (const { field } of OPTION_GROUPS) fields[field].value = product[field].join(', ');

  renderImagePreview();
  editingProductId = product.id;
  el.productFormTitle.textContent = `Ürünü Düzenle: ${product.code}`;
  el.productFormReset.classList.remove('hidden');
  el.productForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

el.productForm.addEventListener('submit', (event) => {
  event.preventDefault();
  guard(async () => {
    const isEdit = editingProductId !== null;
    await api(isEdit ? `/products/${editingProductId}` : '/products', {
      method: isEdit ? 'PUT' : 'POST',
      body: readProductForm(),
      auth: true,
    });
    resetProductForm();
    await loadProducts();
    showMessage(el.panelMessage, isEdit ? 'Ürün güncellendi.' : 'Ürün eklendi.', 'success');
  });
});

el.productFormReset.addEventListener('click', resetProductForm);

el.productRows.addEventListener('click', (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    fillProductForm(products.find((product) => product.id === Number(editId)));
    return;
  }
  if (deleteId && confirm('Bu ürünü ve ürüne ait talepleri silmek istiyor musunuz?')) {
    guard(async () => {
      await api(`/products/${deleteId}`, { method: 'DELETE', auth: true });
      if (editingProductId === Number(deleteId)) resetProductForm();
      await loadProducts();
      showMessage(el.panelMessage, 'Ürün silindi.', 'success');
    });
  }
});

/* ---------- Talepler ---------- */

function requestOptions(request) {
  return REQUEST_OPTION_LABELS.filter(([field]) => request[field])
    .map(([field, label]) => `${label}: ${escapeHtml(request[field])}`)
    .join('<br />');
}

function statusSelect(request) {
  const options = Object.entries(STATUS_LABELS)
    .map(([value, label]) => `<option value="${value}" ${value === request.status ? 'selected' : ''}>${label}</option>`)
    .join('');
  return `<select data-status="${request.id}">${options}</select>`;
}

function requestRow(request) {
  const note = request.note ? `<br /><span class="hint">Not: ${escapeHtml(request.note)}</span>` : '';
  return `
    <tr>
      <td>${formatDate(request.created_at)}</td>
      <td>${escapeHtml(request.product_code)}<br /><span class="hint">${escapeHtml(request.product_name)}</span></td>
      <td>${escapeHtml(request.customer_name)}<br /><span class="hint">${escapeHtml(request.phone)}</span>${note}</td>
      <td>${requestOptions(request)}</td>
      <td>${request.quantity}</td>
      <td>${statusSelect(request)}</td>
      <td><button type="button" class="danger" data-delete-request="${request.id}">Sil</button></td>
    </tr>`;
}

async function loadRequests() {
  await guard(async () => {
    const requests = await api(`/requests?status=${el.statusFilter.value}`, { auth: true });
    el.requestRows.innerHTML = requests.length
      ? requests.map(requestRow).join('')
      : '<tr><td colspan="7" class="empty">Talep bulunmuyor.</td></tr>';

    const pending = await api('/requests?status=yeni', { auth: true });
    el.requestTabButton.textContent = pending.length ? `Talepler (${pending.length})` : 'Talepler';
  });
}

el.statusFilter.addEventListener('change', loadRequests);

el.requestRows.addEventListener('change', (event) => {
  const id = event.target.dataset.status;
  if (!id) return;
  guard(async () => {
    await api(`/requests/${id}`, { method: 'PATCH', body: { status: event.target.value }, auth: true });
    await loadRequests();
    showMessage(el.panelMessage, 'Talep durumu güncellendi.', 'success');
  });
});

el.requestRows.addEventListener('click', (event) => {
  const id = event.target.dataset.deleteRequest;
  if (!id || !confirm('Bu talebi silmek istiyor musunuz?')) return;
  guard(async () => {
    await api(`/requests/${id}`, { method: 'DELETE', auth: true });
    await loadRequests();
    showMessage(el.panelMessage, 'Talep silindi.', 'success');
  });
});

/* ---------- Site bilgileri ---------- */

function fillSettingsForm(settings) {
  for (const field of SETTING_FIELDS) el.settingsForm.elements[field].value = settings[field] ?? '';
}

el.settingsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  guard(async () => {
    const data = new FormData(el.settingsForm);
    const body = Object.fromEntries(SETTING_FIELDS.map((field) => [field, data.get(field)]));
    fillSettingsForm(await api('/settings', { method: 'PUT', body, auth: true }));
    showMessage(el.panelMessage, 'Site bilgileri kaydedildi. Sayfayı yenileyerek görebilirsiniz.', 'success');
  });
});

/* ---------- Baslangic ---------- */

async function start() {
  if (!adminToken.get()) {
    showPanel(false);
    return;
  }
  showPanel(true);
  resetProductForm();
  fillSettingsForm(site);
  await loadProducts();
  await loadRequests();
}

start();
