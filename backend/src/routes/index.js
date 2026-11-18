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
import { bookSearchLimiter } from '../middlewares/rateLimits.js';
import { lookupPages, searchBooks } from '../services/bookSearchService.js';
import { z } from 'zod';
import * as social from '../controllers/socialController.js';
import { imageProxy, imageProxyQuery } from '../controllers/imageProxyController.js';
import { idParam } from '../utils/validators.js';

const bookSearchQuery = z.object({ q: z.string().trim().min(1, '검색어를 입력해 주세요.').max(100) });
const isbnQuery = z.object({ isbn: z.string().regex(/^(\d{13}|\d{9}[\dXx])$/, 'ISBN 형식이 올바르지 않아요.') });

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

// 외부 도서 검색 (카카오 · 네이버 · Google Books) — 키는 서버에만 두고 프록시
api.get('/book-search', requireAuth, bookSearchLimiter, validate({ query: bookSearchQuery }), async (req, res) => {
  res.json(await searchBooks(req.valid.query.q));
});
api.get('/book-search/pages', requireAuth, bookSearchLimiter, validate({ query: isbnQuery }), async (req, res) => {
  res.json({ totalPages: await lookupPages(req.valid.query.isbn) });
});
api.post('/notifications/read', requireAuth, markAllRead);

// 문장 수집
api.get('/quotes', optionalAuth, validate({ query: social.listQuotesQuery }), social.listQuotes);
api.post('/quotes', requireAuth, validate({ body: social.createQuoteSchema }), social.createQuote);
api.put('/quotes/:id', requireAuth, validate({ params: idParam, body: social.updateQuoteSchema }), social.updateQuote);
api.delete('/quotes/:id', requireAuth, validate({ params: idParam }), social.deleteQuote);

// 친구 소식 · 배지
api.get('/feed', requireAuth, social.feed);
api.get('/badges', requireAuth, social.badges);
api.post('/badges/seen', requireAuth, social.badgesSeen);

// 이미지 저장용 표지 프록시
api.get('/image-proxy', requireAuth, validate({ query: imageProxyQuery }), imageProxy);

// 이미지 업로드 (책 표지, 책장 대표 이미지, 배경, 프로필)
api.post('/uploads', requireAuth, imageUpload.single('file'), verifyUploadedImage, (req, res) => {
  if (!req.file) throw badRequest('업로드할 이미지를 선택해 주세요.');
  res.status(201).json({ url: req.file.publicUrl });
});

export default api;
