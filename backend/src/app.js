import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './utils/env.js';
import apiRoutes from './routes/index.js';
import { requireCsrfHeader } from './middlewares/csrf.js';
import { apiLimiter } from './middlewares/rateLimits.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { uploadDir } from './middlewares/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // 사용자 실제 IP(요청 횟수 제한에 사용)를 X-Forwarded-For 에서 몇 단계까지 믿을지
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'font-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
          'object-src': ["'none'"],
          'frame-ancestors': ["'none'"],
          // https 로 서비스할 때만 http 요청을 https 로 올린다 (http 로 테스트할 때 화면이 깨지지 않도록)
          'upgrade-insecure-requests': env.COOKIE_SECURE ? [] : null,
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    })
  );

  app.use(
    cors({
      origin(origin, cb) {
        // 같은 출처(프록시) 요청이나 서버 간 요청은 origin 이 없다
        if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
        cb(null, false);
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'X-Requested-With'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );

  app.use(express.json({ limit: '200kb' }));
  app.use(express.urlencoded({ extended: false, limit: '50kb' }));
  app.use(cookieParser());

  // 업로드 이미지: 실행/스니핑 방지 헤더
  app.use(
    '/uploads',
    express.static(uploadDir, {
      index: false,
      dotfiles: 'deny',
      maxAge: '7d',
      setHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
      },
    })
  );

  app.use('/api', apiLimiter, requireCsrfHeader, apiRoutes);
  app.use('/api', notFoundHandler);

  // 배포 시: 빌드된 프론트엔드를 같은 서버에서 제공 (SPA fallback)
  if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
    app.use(express.static(frontendDist, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api|\/uploads).*/, (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
