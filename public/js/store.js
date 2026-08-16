import { api, escapeHtml, formatPrice, showMessage } from './api.js';
import { whatsappLink } from './layout.js';

const searchInput = document.querySelector('#search');
const onlyInStockInput = document.querySelector('#only-in-stock');
const categoryRow = document.querySelector('#categories');
const listElement = document.querySelector('#product-list');
const messageElement = document.querySelector('#message');
const heroActions = document.querySelector('#hero-actions');

let activeCategory = '';

function productCard(product) {
  const stockClass = product.inStock ? 'in-stock' : 'out-of-stock';
  const stockText = product.inStock ? 'Mevcut' : 'Mevcut Değil';
  const [cover] = product.images;
  const thumb = cover
    ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(product.name)}" loading="lazy" />`
    : escapeHtml(product.code);

  return `
    <a class="product-card" href="/urun.html?id=${product.id}">
      <div class="thumb">${thumb}</div>
      <div class="body">
        <span class="code">Ürün Kodu: ${escapeHtml(product.code)}</span>
        <strong>${escapeHtml(product.name)}</strong>
        <span class="price">${formatPrice(product.price)}</span>
        <span class="badge ${stockClass}">${stockText}</span>
      </div>
    </a>`;
}

function renderCategories(categories) {
  const chip = (value, label) =>
    `<button type="button" class="chip${value === activeCategory ? ' active' : ''}" data-category="${escapeHtml(value)}">${escapeHtml(label)}</button>`;

  categoryRow.innerHTML = categories.length
    ? [chip('', 'Tümü'), ...categories.map((category) => chip(category, category))].join('')
    : '';
}

async function loadProducts() {
  const params = new URLSearchParams({ search: searchInput.value, category: activeCategory });
  if (onlyInStockInput.checked) params.set('inStock', '1');

  try {
    const products = await api(`/products?${params}`);
    listElement.innerHTML = products.length
      ? products.map(productCard).join('')
      : '<p class="empty">Aramanıza uygun ürün bulunamadı.</p>';
    showMessage(messageElement, '');
  } catch (error) {
    listElement.innerHTML = '';
    showMessage(messageElement, error.message, 'error');
  }
}

categoryRow.addEventListener('click', (event) => {
  const button = event.target.closest('.chip');
  if (!button) return;
  activeCategory = button.dataset.category;
  categoryRow.querySelectorAll('.chip').forEach((chip) => chip.classList.toggle('active', chip === button));
  loadProducts();
});

searchInput.addEventListener('input', loadProducts);
onlyInStockInput.addEventListener('change', loadProducts);

const whatsapp = whatsappLink('Merhaba, iş kıyafetleri hakkında bilgi almak istiyorum.');
heroActions.innerHTML = `
  ${whatsapp ? `<a class="button-link whatsapp" href="${whatsapp}" target="_blank" rel="noopener">WhatsApp ile yazın</a>` : ''}
  <a class="button-link secondary-link" href="/iletisim.html">İletişim bilgileri</a>`;

renderCategories(await api('/categories').catch(() => []));
await loadProducts();
