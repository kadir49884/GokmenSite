import { Router } from 'express';
import { login, logout, readToken, requireAdmin } from './auth.js';
import { notFound } from './http-error.js';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listCategories,
  listProducts,
  updateProduct,
  validateProduct,
} from './products.js';
import { getSettings, updateSettings } from './settings.js';
import { handleImageUpload } from './uploads.js';
import {
  createRequest,
  deleteRequest,
  listRequests,
  updateRequestStatus,
  validateRequest,
} from './requests.js';

export const api = Router();

api.post('/admin/login', (req, res) => {
  res.json({ token: login(req.body.password) });
});

api.post('/admin/logout', (req, res) => {
  logout(readToken(req));
  res.json({ ok: true });
});

api.get('/settings', async (req, res) => {
  res.json(await getSettings());
});

api.put('/settings', requireAdmin, async (req, res) => {
  res.json(await updateSettings(req.body));
});

api.post('/uploads', requireAdmin, handleImageUpload);

api.get('/products', async (req, res) => {
  res.json(
    await listProducts({
      search: req.query.search ?? '',
      category: req.query.category ?? '',
      onlyInStock: req.query.inStock === '1',
    }),
  );
});

api.get('/categories', async (req, res) => {
  res.json(await listCategories());
});

api.get('/products/:id', async (req, res) => {
  const product = await getProduct(Number(req.params.id));
  if (!product) throw notFound('Ürün bulunamadı.');
  res.json(product);
});

api.post('/products', requireAdmin, async (req, res) => {
  res.status(201).json(await createProduct(validateProduct(req.body)));
});

api.put('/products/:id', requireAdmin, async (req, res) => {
  const product = await updateProduct(Number(req.params.id), validateProduct(req.body));
  if (!product) throw notFound('Ürün bulunamadı.');
  res.json(product);
});

api.delete('/products/:id', requireAdmin, async (req, res) => {
  if (!(await deleteProduct(Number(req.params.id)))) throw notFound('Ürün bulunamadı.');
  res.json({ ok: true });
});

api.post('/requests', async (req, res) => {
  res.status(201).json(await createRequest(await validateRequest(req.body)));
});

api.get('/requests', requireAdmin, async (req, res) => {
  res.json(await listRequests({ status: req.query.status ?? '' }));
});

api.patch('/requests/:id', requireAdmin, async (req, res) => {
  if (!(await updateRequestStatus(Number(req.params.id), req.body.status))) throw notFound('Talep bulunamadı.');
  res.json({ ok: true });
});

api.delete('/requests/:id', requireAdmin, async (req, res) => {
  if (!(await deleteRequest(Number(req.params.id)))) throw notFound('Talep bulunamadı.');
  res.json({ ok: true });
});
