import fs from 'node:fs';
import { ZodError } from 'zod';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/httpError.js';
import { env } from '../utils/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: '요청한 API를 찾을 수 없습니다.' } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // 요청 처리 중 오류가 나면 이미 저장된 업로드 파일은 정리
  if (req.file?.path) fs.promises.unlink(req.file.path).catch(() => {});

  if (err instanceof ZodError) {
    const fields = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    const first = err.issues[0];
    return res.status(400).json({
      error: { message: first?.message || '입력값을 확인해 주세요.', fields },
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message, ...(err.details ? { fields: err.details } : {}) } });
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `파일은 ${env.MAX_UPLOAD_MB}MB 이하만 올릴 수 있어요.`
        : '파일 업로드 요청이 올바르지 않아요.';
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: { message } });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return res.status(409).json({ error: { message: '이미 존재하는 값이에요.' } });
    if (err.code === 'P2025') return res.status(404).json({ error: { message: '대상을 찾을 수 없어요.' } });
    if (err.code === 'P2003') return res.status(400).json({ error: { message: '연결된 데이터가 올바르지 않아요.' } });
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error('[DB] 데이터베이스에 연결할 수 없습니다. PostgreSQL 이 실행 중인지 확인해 주세요. (npm run db:up)');
    return res.status(503).json({ error: { message: '데이터베이스에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.' } });
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: '요청 본문(JSON) 형식이 올바르지 않아요.' } });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: { message: '요청 데이터가 너무 커요.' } });
  }

  console.error('[Unhandled]', err);
  res.status(500).json({ error: { message: '서버에서 문제가 발생했어요. 잠시 후 다시 시도해 주세요.' } });
}
