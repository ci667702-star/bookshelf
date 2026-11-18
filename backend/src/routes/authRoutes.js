import { Router } from 'express';
import * as c from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { authLimiter } from '../middlewares/rateLimits.js';
import { imageUpload, verifyUploadedImage } from '../middlewares/upload.js';

const r = Router();

// 회원가입은 프로필 이미지(선택)를 함께 받기 위해 multipart 도 허용
r.post(
  '/register',
  authLimiter,
  imageUpload.single('profileImage'),
  verifyUploadedImage,
  validate({ body: c.registerSchema }),
  c.register
);
r.post('/login', authLimiter, validate({ body: c.loginSchema }), c.login);
r.post('/logout', c.logout);
r.get('/me', requireAuth, c.me);

export default r;
