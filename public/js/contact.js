import { contactItems, site, whatsappLink } from './layout.js';

document.querySelector('#about').textContent = site.about ?? '';

const items = contactItems();
document.querySelector('#contact').innerHTML = items.length
  ? items.map((item) => `<li><span>${item.label}:</span> ${item.html}</li>`).join('')
  : '<li>İletişim bilgileri yönetim panelinden eklenir.</li>';

const whatsapp = whatsappLink('Merhaba, iş kıyafetleri hakkında bilgi almak istiyorum.');
document.querySelector('#contact-actions').innerHTML = whatsapp
  ? `<a class="button-link whatsapp" href="${whatsapp}" target="_blank" rel="noopener">WhatsApp ile yazın</a>`
  : '';
