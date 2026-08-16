import { api, escapeHtml, formatPrice, showMessage } from './api.js';
import { site, whatsappLink } from './layout.js';
import { OPTION_GROUPS } from './options.js';

const productId = new URLSearchParams(location.search).get('id');
const elements = {
  message: document.querySelector('#message'),
  detail: document.querySelector('#detail'),
  image: document.querySelector('#image'),
  thumbs: document.querySelector('#thumbs'),
  code: document.querySelector('#code'),
  name: document.querySelector('#name'),
  description: document.querySelector('#description'),
  detailActions: document.querySelector('#detail-actions'),
  price: document.querySelector('#price'),
  stock: document.querySelector('#stock'),
  specs: document.querySelector('#specs'),
  requestSection: document.querySelector('#request-section'),
  requestTitle: document.querySelector('#request-title'),
  stockNote: document.querySelector('#stock-note'),
  optionFields: document.querySelector('#option-fields'),
  form: document.querySelector('#request-form'),
  formMessage: document.querySelector('#form-message'),
};

/** Secenegi olan gruplar icin secim zorunludur. */
const activeGroups = (product) => OPTION_GROUPS.filter((group) => product[group.field].length > 0);

function optionField(group, values) {
  const choices = values
    .map(
      (value, index) => `
      <label>
        <input type="radio" name="${group.requestField}" value="${escapeHtml(value)}" ${index === 0 ? 'checked' : ''} />
        <span>${escapeHtml(value)}</span>
      </label>`,
    )
    .join('');
  return `<div class="field"><label>${group.label}</label><div class="options">${choices}</div></div>`;
}

function showImage(source, name) {
  elements.image.innerHTML = source
    ? `<img src="${escapeHtml(source)}" alt="${escapeHtml(name)}" />`
    : escapeHtml(name);
}

function renderGallery(product) {
  const [cover] = product.images;
  showImage(cover, cover ? product.name : product.code);

  elements.thumbs.innerHTML =
    product.images.length > 1
      ? product.images
          .map(
            (source, index) => `
          <button type="button" class="thumb-button${index === 0 ? ' active' : ''}" data-source="${escapeHtml(source)}">
            <img src="${escapeHtml(source)}" alt="" loading="lazy" />
          </button>`,
          )
          .join('')
      : '';

  elements.thumbs.addEventListener('click', (event) => {
    const button = event.target.closest('.thumb-button');
    if (!button) return;
    showImage(button.dataset.source, product.name);
    elements.thumbs.querySelectorAll('.thumb-button').forEach((other) => {
      other.classList.toggle('active', other === button);
    });
  });
}

function renderProduct(product) {
  document.title = `${product.code} - ${product.name} | ${site.companyName}`;

  renderGallery(product);
  elements.code.textContent = `Ürün Kodu: ${product.code}${product.category ? ` · ${product.category}` : ''}`;
  elements.name.textContent = product.name;
  elements.description.textContent = product.description;
  elements.description.classList.toggle('hidden', !product.description);
  elements.price.textContent = formatPrice(product.price);

  const whatsapp = whatsappLink(`Merhaba, ${product.code} kodlu "${product.name}" ürünü hakkında bilgi almak istiyorum.`);
  elements.detailActions.innerHTML = whatsapp
    ? `<a class="button-link whatsapp" href="${whatsapp}" target="_blank" rel="noopener">WhatsApp ile sor</a>`
    : '';
  elements.stock.textContent = product.inStock ? 'Mevcut' : 'Mevcut Değil';
  elements.stock.className = `badge ${product.inStock ? 'in-stock' : 'out-of-stock'}`;

  elements.specs.innerHTML = activeGroups(product)
    .map((group) => `<li><span>${group.label}:</span> ${escapeHtml(product[group.field].join(', '))}</li>`)
    .join('');

  elements.requestTitle.textContent = product.inStock ? 'Sipariş Talebi Oluştur' : 'Ürün Talebi Oluştur';
  if (!product.inStock) {
    showMessage(
      elements.stockNote,
      'Bu ürün şu anda stokta bulunmuyor. Talep oluşturduğunuzda tedarik edildiğinde sizinle iletişime geçilir.',
      'info',
    );
  }

  elements.optionFields.innerHTML = activeGroups(product)
    .map((group) => optionField(group, product[group.field]))
    .join('');

  elements.detail.classList.remove('hidden');
  elements.requestSection.classList.remove('hidden');
}

function collectRequest(product) {
  const form = new FormData(elements.form);
  const request = {
    productId: product.id,
    customerName: form.get('customerName'),
    phone: form.get('phone'),
    quantity: Number(form.get('quantity')),
    note: form.get('note'),
  };
  for (const group of activeGroups(product)) {
    request[group.requestField] = form.get(group.requestField) ?? '';
  }
  return request;
}

async function init() {
  if (!productId) {
    showMessage(elements.message, 'Ürün bulunamadı.', 'error');
    return;
  }

  let product;
  try {
    product = await api(`/products/${productId}`);
  } catch (error) {
    showMessage(elements.message, error.message, 'error');
    return;
  }
  renderProduct(product);

  elements.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await api('/requests', { method: 'POST', body: collectRequest(product) });
      elements.form.reset();
      showMessage(elements.formMessage, 'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.', 'success');
    } catch (error) {
      showMessage(elements.formMessage, error.message, 'error');
    }
  });
}

init();
