import { api, escapeHtml } from './api.js';

/** Panelden yonetilen site bilgileri; tum sayfalar bu modulu paylasir. */
export const site = await api('/settings').catch(() => ({ companyName: 'Bayram İş Kıyafetleri' }));

export function whatsappLink(message) {
  const digits = String(site.whatsapp ?? '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : '';
}

/** Dolu olan iletisim bilgilerini baglantiya cevirir. */
export function contactItems() {
  return [
    site.phone && { label: 'Telefon', html: `<a href="tel:${escapeHtml(site.phone.replace(/\s/g, ''))}">${escapeHtml(site.phone)}</a>` },
    site.email && { label: 'E-posta', html: `<a href="mailto:${escapeHtml(site.email)}">${escapeHtml(site.email)}</a>` },
    site.address && { label: 'Adres', html: escapeHtml(site.address) },
    site.workingHours && { label: 'Çalışma saatleri', html: escapeHtml(site.workingHours) },
  ].filter(Boolean);
}

function renderFooter(footer) {
  const contact = contactItems()
    .map((item) => `<li><span>${item.label}:</span> ${item.html}</li>`)
    .join('');

  footer.innerHTML = `
    <div class="inner">
      <div>
        <strong>${escapeHtml(site.companyName)}</strong>
        <p>${escapeHtml(site.slogan ?? '')}</p>
      </div>
      <div>
        <h3>İletişim</h3>
        <ul class="contact-list">${contact || '<li>İletişim bilgileri yönetim panelinden eklenir.</li>'}</ul>
      </div>
      <div>
        <h3>Sayfalar</h3>
        <ul class="contact-list">
          <li><a href="/">Ürünler</a></li>
          <li><a href="/iletisim.html">İletişim</a></li>
          <li><a href="/admin.html">Yönetim</a></li>
        </ul>
      </div>
    </div>
    <p class="copyright">© ${new Date().getFullYear()} ${escapeHtml(site.companyName)}</p>`;
}

document.querySelectorAll('[data-company]').forEach((element) => {
  element.textContent = site.companyName;
});
document.querySelectorAll('[data-slogan]').forEach((element) => {
  element.textContent = site.slogan ?? '';
});
document.title = `${document.title} | ${site.companyName}`;

const footer = document.querySelector('#site-footer');
if (footer) renderFooter(footer);
