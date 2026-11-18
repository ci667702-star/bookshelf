import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { badRequest, forbidden, notFound, unauthorized } from '../utils/httpError.js';
import { publicUserSelect, serializeBook } from '../utils/serializers.js';
import { booleanish, optionalText } from '../utils/validators.js';
import { dateToKey } from '../utils/dates.js';
import { notify } from '../services/notificationService.js';
import { markBadgesSeen, syncBadges } from '../services/badgeService.js';

const bookSelect = { id: true, title: true, author: true, coverImage: true, totalPages: true };

// ───────── 문장 수집 ─────────

export const listQuotesQuery = z.object({
  scope: z.enum(['mine', 'book', 'user']).default('mine'),
  bookId: z.string().max(40).optional(),
  userId: z.string().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const quoteBody = {
  bookId: z.string().min(1, '책을 골라 주세요.').max(40),
  content: z.string().trim().min(1, '문장을 입력해 주세요.').max(500, '문장은 500자 이하예요.'),
  page: z.union([z.coerce.number().int().min(1).max(20000), z.null()]).optional(),
  memo: optionalText(200),
  isPublic: booleanish.optional().default(false),
};
export const createQuoteSchema = z.object(quoteBody);
export const updateQuoteSchema = z.object(quoteBody).partial();

function serializeQuote(q, viewerId) {
  return {
    id: q.id,
    content: q.content,
    page: q.page,
    memo: q.memo,
    isPublic: q.isPublic,
    createdAt: q.createdAt,
    book: q.book ? serializeBook(q.book) : undefined,
    user: q.user,
    isMine: q.userId === viewerId,
  };
}

const quoteInclude = { book: { select: bookSelect }, user: { select: publicUserSelect } };

export async function listQuotes(req, res) {
  const me = req.user?.id;
  const { scope, bookId, userId, limit } = req.valid.query;
  let where;
  if (scope === 'mine') {
    if (!me) throw unauthorized();
    where = { userId: me };
  } else if (scope === 'book') {
    if (!bookId) throw badRequest('bookId 가 필요해요.');
    where = { bookId, OR: [{ isPublic: true }, ...(me ? [{ userId: me }] : [])] };
  } else {
    if (!userId) throw badRequest('userId 가 필요해요.');
    where = { userId, ...(userId === me ? {} : { isPublic: true }) };
  }
  const items = await prisma.quote.findMany({ where, include: quoteInclude, orderBy: { createdAt: 'desc' }, take: limit });
  res.json({ items: items.map((q) => serializeQuote(q, me)) });
}

async function assertOwnBook(userId, bookId) {
  const book = await prisma.book.findUnique({ where: { id: bookId }, select: { createdById: true, totalPages: true } });
  if (!book || book.createdById !== userId) throw badRequest('내 책장에 있는 책을 골라 주세요.', { bookId: '내 책을 골라 주세요.' });
  return book;
}

export async function createQuote(req, res) {
  const body = req.valid.body;
  const book = await assertOwnBook(req.user.id, body.bookId);
  if (body.page && body.page > book.totalPages) throw badRequest(`이 책은 ${book.totalPages}쪽까지 있어요.`, { page: '쪽수를 확인해 주세요.' });
  const quote = await prisma.quote.create({ data: { ...body, page: body.page ?? null, userId: req.user.id }, include: quoteInclude });
  res.status(201).json({ quote: serializeQuote(quote, req.user.id) });
}

async function getOwnQuote(id, userId) {
  const q = await prisma.quote.findUnique({ where: { id } });
  if (!q) throw notFound('문장을 찾을 수 없어요.');
  if (q.userId !== userId) throw forbidden('내가 모은 문장만 고칠 수 있어요.');
  return q;
}

export async function updateQuote(req, res) {
  const q = await getOwnQuote(req.valid.params.id, req.user.id);
  const data = { ...req.valid.body };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  if (data.bookId) await assertOwnBook(req.user.id, data.bookId);
  const quote = await prisma.quote.update({ where: { id: q.id }, data, include: quoteInclude });
  res.json({ quote: serializeQuote(quote, req.user.id) });
}

export async function deleteQuote(req, res) {
  const q = await getOwnQuote(req.valid.params.id, req.user.id);
  await prisma.quote.delete({ where: { id: q.id } });
  res.json({ ok: true });
}

// ───────── 팔로우 ─────────

export async function toggleFollow(req, res) {
  const me = req.user.id;
  const targetId = req.valid.params.id;
  if (targetId === me) throw badRequest('나 자신은 팔로우할 수 없어요.');
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!target) throw notFound('사용자를 찾을 수 없어요.');

  const where = { followerId_followingId: { followerId: me, followingId: targetId } };
  const existing = await prisma.follow.findUnique({ where });
  if (existing) {
    await prisma.follow.delete({ where });
  } else {
    await prisma.follow.create({ data: { followerId: me, followingId: targetId } });
    await notify({ userId: targetId, actorId: me, type: 'FOLLOW' });
  }
  const followerCount = await prisma.follow.count({ where: { followingId: targetId } });
  res.json({ following: !existing, followerCount });
}

export const followListQuery = z.object({ type: z.enum(['followers', 'following']).default('followers') });

export async function listFollows(req, res) {
  const { id } = req.valid.params;
  const { type } = req.valid.query;
  const rows = await prisma.follow.findMany({
    where: type === 'followers' ? { followingId: id } : { followerId: id },
    include: { follower: { select: { ...publicUserSelect, bio: true } }, following: { select: { ...publicUserSelect, bio: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  const users = rows.map((r) => (type === 'followers' ? r.follower : r.following));
  const mine = await prisma.follow.findMany({
    where: { followerId: req.user.id, followingId: { in: users.map((u) => u.id) } },
    select: { followingId: true },
  });
  const set = new Set(mine.map((m) => m.followingId));
  res.json({ items: users.map((u) => ({ ...u, isFollowing: set.has(u.id), isMe: u.id === req.user.id })) });
}

/** 친구 소식: 팔로우한 사람들의 공개 활동 (완독 · 새 책 · 독후감 · 문장) */
export async function feed(req, res) {
  const me = req.user.id;
  const limit = 30;
  const following = (await prisma.follow.findMany({ where: { followerId: me }, select: { followingId: true } })).map((f) => f.followingId);
  if (!following.length) return res.json({ followingCount: 0, items: [] });

  const [records, reviews, quotes] = await Promise.all([
    prisma.readingRecord.findMany({
      where: { userId: { in: following }, bookshelf: { isPublic: true } },
      include: { book: { select: bookSelect }, user: { select: publicUserSelect } },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    }),
    prisma.review.findMany({
      where: { userId: { in: following }, isPublic: true },
      include: { book: { select: bookSelect }, user: { select: publicUserSelect } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.quote.findMany({
      where: { userId: { in: following }, isPublic: true },
      include: quoteInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
  ]);

  const items = [
    ...records.map((r) =>
      r.status === 'FINISHED' && r.finishDate
        ? { id: `f-${r.id}`, type: 'finish', at: r.finishDate, date: dateToKey(r.finishDate), user: r.user, book: r.book, rating: r.rating }
        : { id: `a-${r.id}`, type: 'add', at: r.createdAt, user: r.user, book: r.book, status: r.status }
    ),
    ...reviews.map((v) => ({ id: `r-${v.id}`, type: 'review', at: v.createdAt, user: v.user, book: v.book, review: { id: v.id, title: v.title, rating: v.rating } })),
    ...quotes.map((q) => ({ id: `q-${q.id}`, type: 'quote', at: q.createdAt, user: q.user, book: q.book, quote: { id: q.id, content: q.content, page: q.page } })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit);

  res.json({ followingCount: following.length, items });
}

// ───────── 배지 ─────────

export async function badges(req, res) {
  res.json(await syncBadges(req.user.id));
}

export async function badgesSeen(req, res) {
  await markBadgesSeen(req.user.id);
  res.json({ ok: true });
}
