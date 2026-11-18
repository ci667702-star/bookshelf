import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import bookshelfRoutes from './bookshelfRoutes.js';
import bookRoutes from './bookRoutes.js';
import readingRoutes from './readingRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import sharedRoutes from './sharedRoutes.js';
import { optionalAuth, requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { imageUpload, verifyUploadedImage } from '../middlewares/upload.js';
import { badRequest } from '../utils/httpError.js';
import { dashboard } from '../controllers/dashboardController.js';
import { search, searchQuery } from '../controllers/searchController.js';
import { listNotifications, markAllRead } from '../controllers/notificationController.js';

const api = Router();

api.get('/health', (req, res) => res.json({ ok: true }));

api.use('/auth', authRoutes);
api.use('/users', userRoutes);
api.use('/bookshelves', bookshelfRoutes);
api.use('/books', bookRoutes);
api.use('/reading', readingRoutes);
api.use('/reviews', reviewRoutes);
api.use('/shared-bookshelves', sharedRoutes);

api.get('/dashboard', requireAuth, dashboard);
api.get('/search', optionalAuth, validate({ query: searchQuery }), search);
api.get('/notifications', requireAuth, listNotifications);
api.post('/notifications/read', requireAuth, markAllRead);

// 이미지 업로드 (책 표지, 책장 대표 이미지, 배경, 프로필)
api.post('/uploads', requireAuth, imageUpload.single('file'), verifyUploadedImage, (req, res) => {
  if (!req.file) throw badRequest('업로드할 이미지를 선택해 주세요.');
  res.status(201).json({ url: req.file.publicUrl });
});

export default api;
