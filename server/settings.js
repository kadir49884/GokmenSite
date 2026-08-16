import { db } from './db.js';

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

export function getSettings() {
  const saved = Object.fromEntries(
    db.prepare('SELECT key, value FROM settings').all().map((row) => [row.key, row.value]),
  );
  return { ...DEFAULTS, ...saved };
}

export function updateSettings(body) {
  const statement = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  );
  const save = db.transaction((entries) => {
    for (const [key, value] of entries) statement.run(key, value);
  });

  save(
    Object.keys(DEFAULTS)
      .filter((key) => key in body)
      .map((key) => [key, String(body[key] ?? '').trim()]),
  );
  return getSettings();
}
