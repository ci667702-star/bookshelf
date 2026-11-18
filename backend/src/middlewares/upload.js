import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from '../utils/env.js';
import { badRequest } from '../utils/httpError.js';

export const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
};

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = ALLOWED[file.mimetype]?.[0] ?? '.bin';
    cb(null, `${Date.now().toString(36)}-${crypto.randomBytes(12).toString('hex')}${ext}`);
  },
});

export const imageUpload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1, fields: 30 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExts = ALLOWED[file.mimetype];
    if (!allowedExts || !allowedExts.includes(ext)) {
      return cb(badRequest('jpg, png, webp, gif 이미지만 올릴 수 있어요.'));
    }
    cb(null, true);
  },
});

// 확장자/MIME 위장 방지: 실제 파일 시그니처 확인
const SIGNATURES = [
  { mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/gif', test: (b) => b.subarray(0, 4).toString('ascii') === 'GIF8' },
  {
    mime: 'image/webp',
    test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

/** multer 다음에 실행: 업로드된 파일의 매직 바이트를 확인하고 아니면 삭제 */
export async function verifyUploadedImage(req, res, next) {
  if (!req.file) return next();
  const fd = await fs.promises.open(req.file.path, 'r');
  const buf = Buffer.alloc(12);
  try {
    await fd.read(buf, 0, 12, 0);
  } finally {
    await fd.close();
  }
  const sig = SIGNATURES.find((s) => s.mime === req.file.mimetype);
  if (!sig || !sig.test(buf)) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    throw badRequest('이미지 파일이 손상되었거나 형식이 올바르지 않아요.');
  }
  req.file.publicUrl = `/uploads/${req.file.filename}`;
  next();
}
