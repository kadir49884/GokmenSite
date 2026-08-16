import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { badRequest } from './http-error.js';

const IMAGE_DIR = path.join(process.cwd(), 'public', 'images');
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const MAX_SIZE = 5 * 1024 * 1024;

fs.mkdirSync(IMAGE_DIR, { recursive: true });

/** Turkce karakterli dosya adlarini guvenli bir dosya adina cevirir. */
function safeFileName(rawName) {
  // Multipart dosya adlari latin1 olarak okunur, once UTF-8'e cevrilir.
  const originalName = Buffer.from(rawName, 'latin1').toString('utf8');
  const extension = path.extname(originalName).toLowerCase();
  const base =
    path
      .basename(originalName, path.extname(originalName))
      .toLowerCase()
      .replace(/[çğıöşü]/g, (char) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[char])
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'gorsel';
  return `${base}-${Date.now().toString(36)}${extension}`;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, done) => done(null, IMAGE_DIR),
    filename: (req, file, done) => done(null, safeFileName(file.originalname)),
  }),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, done) => {
    if (!ALLOWED_EXTENSIONS.has(path.extname(file.originalname).toLowerCase())) {
      done(badRequest('Sadece png, jpg ve webp dosyaları yüklenebilir.'));
      return;
    }
    done(null, true);
  },
}).single('image');

export function handleImageUpload(req, res, next) {
  upload(req, res, (error) => {
    if (error) {
      const message = error.code === 'LIMIT_FILE_SIZE' ? 'Görsel en fazla 5 MB olabilir.' : error.message;
      next(error.status ? error : badRequest(message));
      return;
    }
    if (!req.file) {
      next(badRequest('Görsel seçilmedi.'));
      return;
    }
    res.status(201).json({ url: `/images/${req.file.filename}` });
  });
}
