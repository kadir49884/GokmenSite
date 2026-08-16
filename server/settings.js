import { databaseReady, db } from './db.js';

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
  await databaseReady;
  const { rows } = await db.execute('SELECT key, value FROM settings');
  const saved = Object.fromEntries(
    rows.map((row) => [row.key, row.value]),
  );
  return { ...DEFAULTS, ...saved };
}

export async function updateSettings(body) {
  await databaseReady;
  const statements = Object.keys(DEFAULTS)
    .filter((key) => key in body)
    .map((key) => ({
      sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      args: [key, String(body[key] ?? '').trim()],
    }));
  if (statements.length > 0) await db.batch(statements, 'write');
  return getSettings();
}
