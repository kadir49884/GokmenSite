import crypto from 'node:crypto';
import { unauthorized } from './http-error.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (process.env.VERCEL ? '' : 'admin123');
const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

function passwordMatches(input) {
  const given = Buffer.from(String(input ?? ''));
  const expected = Buffer.from(ADMIN_PASSWORD);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

export function login(password) {
  if (!ADMIN_PASSWORD) throw unauthorized('Yönetici şifresi Vercel ortam değişkenlerinde tanımlanmamış.');
  if (!passwordMatches(password)) throw unauthorized('Şifre hatalı.');
  const expiresAt = String(Date.now() + TOKEN_LIFETIME_MS);
  const signature = crypto.createHmac('sha256', ADMIN_PASSWORD).update(expiresAt).digest('base64url');
  return `${expiresAt}.${signature}`;
}

export function logout() {
  // Token istemciden silinir; stateless imza sayesinde Vercel instance'lari arasinda da calisir.
}

export function readToken(req) {
  return String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
}

export function requireAdmin(req, res, next) {
  const [expiresAt, signature] = readToken(req).split('.');
  if (!expiresAt || !signature || Number(expiresAt) < Date.now() || !ADMIN_PASSWORD) {
    throw unauthorized('Önce yönetici girişi yapmalısınız.');
  }

  const expected = crypto.createHmac('sha256', ADMIN_PASSWORD).update(expiresAt).digest('base64url');
  const givenBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (givenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(givenBuffer, expectedBuffer)) {
    throw unauthorized('Önce yönetici girişi yapmalısınız.');
  }
  next();
}
