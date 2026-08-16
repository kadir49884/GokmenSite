import path from 'node:path';
import 'dotenv/config';
import express from 'express';
import { api } from './routes.js';

export const app = express();
const publicDir = path.join(process.cwd(), 'public');

app.use(express.json());
app.use(express.static(publicDir));
app.use('/api', api);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'İstek adresi bulunamadı.' });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, '404.html'));
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  if (status === 500) console.error(error);
  res.status(status).json({ error: status === 500 ? 'Sunucu hatası.' : error.message });
});
