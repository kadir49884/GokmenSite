import crypto from 'node:crypto';
import { unauthorized } from './http-error.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/** Girişler bellekte tutulur; sunucu yeniden başlarsa yönetici tekrar giriş yapar. */
const activeTokens = new Set();

function passwordMatches(input) {
  const given = Buffer.from(String(input ?? ''));
  const expected = Buffer.from(ADMIN_PASSWORD);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

export function login(password) {
  if (!passwordMatches(password)) throw unauthorized('Şifre hatalı.');
  const token = crypto.randomBytes(24).toString('hex');
  activeTokens.add(token);
  return token;
}

export function logout(token) {
  activeTokens.delete(token);
}

export function readToken(req) {
  return String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
}

export function requireAdmin(req, res, next) {
  if (!activeTokens.has(readToken(req))) throw unauthorized('Önce yönetici girişi yapmalısınız.');
  next();
}
