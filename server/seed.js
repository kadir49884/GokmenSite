import { databaseReady } from './db.js';
import { listProducts } from './products.js';

await databaseReady;
const products = await listProducts();
console.log(`Veritabanı hazır: ${products.length} ürün mevcut.`);
