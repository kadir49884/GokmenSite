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

api.get('/settings', (req, res) => {
  res.json(getSettings());
});

api.put('/settings', requireAdmin, (req, res) => {
  res.json(updateSettings(req.body));
});

api.post('/uploads', requireAdmin, handleImageUpload);

api.get('/products', (req, res) => {
  res.json(
    listProducts({
      search: req.query.search ?? '',
      category: req.query.category ?? '',
      onlyInStock: req.query.inStock === '1',
    }),
  );
});

api.get('/categories', (req, res) => {
  res.json(listCategories());
});

api.get('/products/:id', (req, res) => {
  const product = getProduct(Number(req.params.id));
  if (!product) throw notFound('Ürün bulunamadı.');
  res.json(product);
});

api.post('/products', requireAdmin, (req, res) => {
  res.status(201).json(createProduct(validateProduct(req.body)));
});

api.put('/products/:id', requireAdmin, (req, res) => {
  const product = updateProduct(Number(req.params.id), validateProduct(req.body));
  if (!product) throw notFound('Ürün bulunamadı.');
  res.json(product);
});

api.delete('/products/:id', requireAdmin, (req, res) => {
  if (!deleteProduct(Number(req.params.id))) throw notFound('Ürün bulunamadı.');
  res.json({ ok: true });
});

api.post('/requests', (req, res) => {
  res.status(201).json(createRequest(validateRequest(req.body)));
});

api.get('/requests', requireAdmin, (req, res) => {
  res.json(listRequests({ status: req.query.status ?? '' }));
});

api.patch('/requests/:id', requireAdmin, (req, res) => {
  if (!updateRequestStatus(Number(req.params.id), req.body.status)) throw notFound('Talep bulunamadı.');
  res.json({ ok: true });
});

api.delete('/requests/:id', requireAdmin, (req, res) => {
  if (!deleteRequest(Number(req.params.id))) throw notFound('Talep bulunamadı.');
  res.json({ ok: true });
});
