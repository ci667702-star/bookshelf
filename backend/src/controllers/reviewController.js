import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { badRequest, forbidden, notFound, unauthorized } from '../utils/httpError.js';
import { publicUserSelect, reviewInclude, serializeReview } from '../utils/serializers.js';
import { booleanish, rating } from '../utils/validators.js';
import {
  getViewableReview,
  getViewableShared,
  requireSharedMember,
  reviewVisibleWhere,
} from '../services/accessService.js';
import { notify, removeLikeNotification } from '../services/notificationService.js';

export const listReviewsQuery = z.object({
  scope: z.enum(['feed', 'mine', 'user', 'book', 'shared']).default('feed'),
  userId: z.string().max(40).optional(),
  bookId: z.string().max(40).optional(),
  sharedBookshelfId: z.string().max(40).optional(),
  sort: z.enum(['recent', 'popular']).default('recent'),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

const reviewBody = {
  bookId: z.string().min(1, '관련 책을 선택해 주세요.').max(40),
  title: z.string().trim().min(1, '제목을 입력해 주세요.').max(100, '제목은 100자 이하예요.'),
  content: z.string().trim().min(10, '내용을 10자 이상 써 주세요.').max(10000, '내용은 10,000자 이하예요.'),
  rating,
  isPublic: booleanish.optional().default(false),
  sharedBookshelfId: z.union([z.string().max(40), z.literal(''), z.null()]).optional().transform((v) => v || null),
};

export const createReviewSchema = z.object(reviewBody);
export const updateReviewSchema = z.object(reviewBody).partial();
export const commentSchema = z.object({
  content: z.string().trim().min(1, '댓글을 입력해 주세요.').max(500, '댓글은 500자 이하예요.'),
});
export const commentParams = z.object({ id: z.string().min(1).max(40), commentId: z.string().min(1).max(40) });

export async function listReviews(req, res) {
  const viewerId = req.user?.id;
  const { scope, userId, bookId, sharedBookshelfId, sort, q, page, limit } = req.valid.query;

  const filters = [reviewVisibleWhere(viewerId)];
  if (scope === 'feed') filters.push({ isPublic: true });
  if (scope === 'mine') {
    if (!viewerId) throw unauthorized();
    filters.push({ userId: viewerId });
  }
  if (scope === 'user') {
    if (!userId) throw badRequest('userId 가 필요해요.');
    filters.push({ userId });
  }
  if (scope === 'book') {
    if (!bookId) throw badRequest('bookId 가 필요해요.');
    filters.push({ bookId });
  }
  if (scope === 'shared') {
    if (!sharedBookshelfId) throw badRequest('sharedBookshelfId 가 필요해요.');
    await getViewableShared(sharedBookshelfId, viewerId);
    filters.push({ sharedBookshelfId });
  }
  if (q) {
    filters.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { book: { title: { contains: q, mode: 'insensitive' } } },
      ],
    });
  }

  const where = { AND: filters };
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: reviewInclude(viewerId),
      orderBy:
        sort === 'popular' ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }] : [{ createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  res.json({
    items: items.map((r) => serializeReview(r, viewerId)),
    page,
    total,
    hasMore: page * limit < total,
  });
}

export async function getReview(req, res) {
  const viewerId = req.user?.id;
  const review = await getViewableReview(req.valid.params.id, viewerId, reviewInclude(viewerId));
  // 작성자의 해당 책 독서 기록 (공개 가능한 범위의 요약)
  const record = await prisma.readingRecord.findFirst({
    where: { bookId: review.bookId, userId: review.userId },
    select: { status: true, rating: true, startDate: true, finishDate: true },
  });
  res.json({
    review: serializeReview(review, viewerId),
    record: record
      ? {
          status: record.status,
          rating: record.rating,
          startDate: record.startDate?.toISOString().slice(0, 10) ?? null,
          finishDate: record.finishDate?.toISOString().slice(0, 10) ?? null,
        }
      : null,
  });
}

async function assertReviewTargets(userId, { bookId, sharedBookshelfId }) {
  if (bookId) {
    const book = await prisma.book.findUnique({ where: { id: bookId }, select: { createdById: true } });
    if (!book || book.createdById !== userId) {
      throw badRequest('내 책장에 있는 책을 골라 주세요.', { bookId: '내 책장에 있는 책을 골라 주세요.' });
    }
  }
  if (sharedBookshelfId) await requireSharedMember(sharedBookshelfId, userId);
}

export async function createReview(req, res) {
  const body = req.valid.body;
  await assertReviewTargets(req.user.id, body);
  const review = await prisma.review.create({
    data: { ...body, userId: req.user.id },
    include: reviewInclude(req.user.id),
  });
  res.status(201).json({ review: serializeReview(review, req.user.id) });
}

async function getOwnReview(id, userId) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw notFound('독후감을 찾을 수 없어요.');
  if (review.userId !== userId) throw forbidden('내가 쓴 독후감만 수정하거나 지울 수 있어요.');
  return review;
}

export async function updateReview(req, res) {
  const review = await getOwnReview(req.valid.params.id, req.user.id);
  const data = { ...req.valid.body };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  await assertReviewTargets(req.user.id, data);
  const updated = await prisma.review.update({
    where: { id: review.id },
    data,
    include: reviewInclude(req.user.id),
  });
  res.json({ review: serializeReview(updated, req.user.id) });
}

export async function deleteReview(req, res) {
  const review = await getOwnReview(req.valid.params.id, req.user.id);
  await prisma.review.delete({ where: { id: review.id } });
  res.json({ ok: true });
}

/** 좋아요 토글 */
export async function toggleLike(req, res) {
  const userId = req.user.id;
  const review = await getViewableReview(req.valid.params.id, userId);
  const where = { userId_reviewId: { userId, reviewId: review.id } };
  const existing = await prisma.like.findUnique({ where });

  let liked;
  if (existing) {
    await prisma.like.delete({ where });
    await removeLikeNotification({ userId: review.userId, actorId: userId, reviewId: review.id });
    liked = false;
  } else {
    await prisma.like.upsert({ where, create: { userId, reviewId: review.id }, update: {} });
    await notify({ userId: review.userId, actorId: userId, type: 'LIKE', reviewId: review.id });
    liked = true;
  }
  const likeCount = await prisma.like.count({ where: { reviewId: review.id } });
  res.json({ liked, likeCount });
}

export async function listComments(req, res) {
  const review = await getViewableReview(req.valid.params.id, req.user?.id);
  const comments = await prisma.comment.findMany({
    where: { reviewId: review.id },
    include: { user: { select: publicUserSelect } },
    orderBy: { createdAt: 'asc' },
  });
  res.json({
    items: comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      user: c.user,
      canDelete: !!req.user && (c.userId === req.user.id || review.userId === req.user.id),
    })),
  });
}

export async function createComment(req, res) {
  const review = await getViewableReview(req.valid.params.id, req.user.id);
  const comment = await prisma.comment.create({
    data: { reviewId: review.id, userId: req.user.id, content: req.valid.body.content },
    include: { user: { select: publicUserSelect } },
  });
  await notify({ userId: review.userId, actorId: req.user.id, type: 'COMMENT', reviewId: review.id });
  res.status(201).json({
    comment: { id: comment.id, content: comment.content, createdAt: comment.createdAt, user: comment.user, canDelete: true },
  });
}

/** 댓글 삭제: 댓글 작성자 또는 독후감 작성자 */
export async function deleteComment(req, res) {
  const { id, commentId } = req.valid.params;
  const comment = await prisma.comment.findUnique({ where: { id: commentId }, include: { review: true } });
  if (!comment || comment.reviewId !== id) throw notFound('댓글을 찾을 수 없어요.');
  if (comment.userId !== req.user.id && comment.review.userId !== req.user.id) {
    throw forbidden('내 댓글만 지울 수 있어요.');
  }
  await prisma.comment.delete({ where: { id: comment.id } });
  res.json({ ok: true });
}
