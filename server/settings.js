import { readData, updateData } from './store.js';

/** Panelden duzenlenebilen site bilgileri ve varsayilan degerleri. */
const DEFAULTS = {
  companyName: 'Bayram İş Kıyafetleri',
  slogan: 'Dayanıklı kumaş, ölçüsünde dikim, kurumsal iş kıyafetleri.',
  about:
    'Restoran, market, fabrika ve sağlık kuruluşları için iş önlüğü, iş takımı ve iş pantolonu üretiyoruz. ' +
    'Tüm ürünler Alpaka ve Gabardin kumaş seçenekleriyle, istediğiniz beden ve renkte hazırlanır.',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  workingHours: '',
};

export async function getSettings() {
  const { settings } = await readData();
  return { ...DEFAULTS, ...settings };
}

export async function updateSettings(body) {
  const saved = await updateData((data) => {
    for (const key of Object.keys(DEFAULTS)) {
      if (key in body) data.settings[key] = String(body[key] ?? '').trim();
    }
    return data.settings;
  });
  return { ...DEFAULTS, ...saved };
}
