import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { badRequest, forbidden, unauthorized } from '../utils/httpError.js';
import { unlockedStickers } from '../services/badgeService.js';
import { publicUserSelect, serializeRecord, serializeReview, reviewInclude } from '../utils/serializers.js';
import { booleanish, optionalImage, optionalText } from '../utils/validators.js';
import { getOwnedShelf, getViewableShelf, reviewVisibleWhere } from '../services/accessService.js';
import { summarizeRecords } from '../services/readingService.js';
import {
  REWARD_STICKERS,
  THEMES,
  decorationSchema,
  defaultDecoration,
  serializeDecoration,
} from '../services/decorationService.js';

const shelfBody = {
  name: z.string().trim().min(1, '책장 이름을 입력해 주세요.').max(40, '책장 이름은 40자 이하예요.'),
  description: optionalText(300),
  coverImage: optionalImage,
  isPublic: booleanish.optional(),
  theme: z.enum(THEMES).optional(),
};

export const createShelfSchema = z.object(shelfBody);
export const updateShelfSchema = z.object(shelfBody).partial();
export const listShelvesQuery = z.object({
  scope: z.enum(['mine', 'public', 'user']).default('mine'),
  userId: z.string().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});
export const deleteShelfQuery = z.object({ moveTo: z.string().max(40).optional() });
export { decorationSchema };

function shelfSummary(s) {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    coverImage: s.coverImage,
    isPublic: s.isPublic,
    theme: s.theme,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    owner: s.owner,
    bookCount: s._count?.records ?? 0,
    previewBooks: (s.records ?? []).map((r) => ({
      id: r.book.id,
      title: r.book.title,
      author: r.book.author,
      coverImage: r.book.coverImage,
      totalPages: r.book.totalPages,
    })),
  };
}

const summaryInclude = {
  owner: { select: publicUserSelect },
  _count: { select: { records: true } },
  records: { take: 12, orderBy: { updatedAt: 'desc' }, include: { book: true } },
};

export async function listShelves(req, res) {
  const { scope, userId, limit } = req.valid.query;
  let where;
  if (scope === 'mine') {
    if (!req.user) throw unauthorized();
    where = { ownerId: req.user.id };
  } else if (scope === 'user') {
    if (!userId) throw badRequest('userId 가 필요해요.');
    where = { ownerId: userId, ...(req.user?.id === userId ? {} : { isPublic: true }) };
  } else {
    // 둘러보기: 다른 사람들의 공개 책장 중 책이 있는 것
    where = { isPublic: true, records: { some: {} }, ...(req.user ? { NOT: { ownerId: req.user.id } } : {}) };
  }

  const shelves = await prisma.bookshelf.findMany({
    where,
    include: summaryInclude,
    orderBy: scope === 'mine' ? { createdAt: 'asc' } : { updatedAt: 'desc' },
    take: limit,
  });
  res.json({ items: shelves.map(shelfSummary) });
}

export async function createShelf(req, res) {
  const data = req.valid.body;
  const count = await prisma.bookshelf.count({ where: { ownerId: req.user.id } });
  if (count >= 20) throw badRequest('책장은 20개까지 만들 수 있어요.');
  const theme = data.theme ?? 'cream';

  const shelf = await prisma.$transaction(async (tx) => {
    const created = await tx.bookshelf.create({
      data: { ...data, theme, isPublic: data.isPublic ?? false, ownerId: req.user.id },
    });
    await tx.bookshelfDecoration.create({
      data: { userId: req.user.id, bookshelfId: created.id, ...defaultDecoration(theme) },
    });
    return tx.bookshelf.findUnique({ where: { id: created.id }, include: summaryInclude });
  });
  res.status(201).json({ shelf: shelfSummary(shelf) });
}

export async function getShelf(req, res) {
  const viewerId = req.user?.id;
  const shelf = await getViewableShelf(req.valid.params.id, viewerId);
  const isOwner = shelf.ownerId === viewerId;

  const [records, decoration] = await Promise.all([
    prisma.readingRecord.findMany({
      where: { bookshelfId: shelf.id },
      include: { book: true },
      orderBy: [{ createdAt: 'asc' }],
    }),
    prisma.bookshelfDecoration.findUnique({ where: { bookshelfId: shelf.id } }),
  ]);

  // 이 책장의 책에 대해 작성자가 쓴 독후감 (내 책장이면 전부, 아니면 공개된 것만)
  const reviews = await prisma.review.findMany({
    where: {
      AND: [
        { userId: shelf.ownerId, bookId: { in: records.map((r) => r.bookId) } },
        isOwner ? {} : reviewVisibleWhere(viewerId),
      ],
    },
    include: reviewInclude(viewerId),
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  res.json({
    shelf: {
      id: shelf.id,
      name: shelf.name,
      description: shelf.description,
      coverImage: shelf.coverImage,
      isPublic: shelf.isPublic,
      theme: shelf.theme,
      createdAt: shelf.createdAt,
      updatedAt: shelf.updatedAt,
      owner: shelf.owner,
    },
    isOwner,
    stats: summarizeRecords(records),
    records: records.map(serializeRecord),
    decoration: serializeDecoration(decoration, shelf.theme),
    reviews: reviews.map((r) => serializeReview(r, viewerId)),
  });
}

export async function updateShelf(req, res) {
  const shelf = await getOwnedShelf(req.valid.params.id, req.user.id);
  const data = { ...req.valid.body };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.bookshelf.update({ where: { id: shelf.id }, data, include: summaryInclude });
    if (data.theme) {
      await tx.bookshelfDecoration.updateMany({ where: { bookshelfId: shelf.id }, data: { theme: data.theme } });
    }
    return s;
  });
  res.json({ shelf: shelfSummary(updated) });
}

export async function deleteShelf(req, res) {
  const shelf = await getOwnedShelf(req.valid.params.id, req.user.id);
  const others = await prisma.bookshelf.findMany({
    where: { ownerId: req.user.id, NOT: { id: shelf.id } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });
  if (others.length === 0) throw badRequest('책장은 최소 1개가 있어야 해요. 다른 책장을 먼저 만들어 주세요.');

  const { moveTo } = req.valid.query;
  const target = moveTo ? others.find((o) => o.id === moveTo) : others[0];
  if (!target) throw badRequest('책을 옮길 책장을 다시 선택해 주세요.');

  // 책장에 있던 책은 사라지지 않고 다른 책장으로 옮겨진다
  const moved = await prisma.$transaction(async (tx) => {
    const r = await tx.readingRecord.updateMany({ where: { bookshelfId: shelf.id }, data: { bookshelfId: target.id } });
    await tx.bookshelf.delete({ where: { id: shelf.id } });
    return r.count;
  });
  res.json({ ok: true, movedTo: target, movedCount: moved });
}

// ───────── 책장 꾸미기 ─────────

export async function getDecoration(req, res) {
  const shelf = await getViewableShelf(req.valid.params.id, req.user?.id);
  const deco = await prisma.bookshelfDecoration.findUnique({ where: { bookshelfId: shelf.id } });
  res.json({ decoration: serializeDecoration(deco, shelf.theme), isOwner: shelf.ownerId === req.user?.id });
}

export async function updateDecoration(req, res) {
  const shelf = await getOwnedShelf(req.valid.params.id, req.user.id);
  const data = req.valid.body;
  const unlocked = await unlockedStickers(req.user.id);
  const locked = data.decorations.find((d) => d.kind === 'sticker' && REWARD_STICKERS.includes(d.type) && !unlocked.includes(d.type));
  if (locked) throw forbidden('아직 열리지 않은 스티커예요. 배지를 모으면 쓸 수 있어요.');
  const deco = await prisma.$transaction(async (tx) => {
    const d = await tx.bookshelfDecoration.upsert({
      where: { bookshelfId: shelf.id },
      create: { userId: req.user.id, bookshelfId: shelf.id, ...data },
      update: data,
    });
    await tx.bookshelf.update({ where: { id: shelf.id }, data: { theme: data.theme } });
    return d;
  });
  res.json({ decoration: serializeDecoration(deco, shelf.theme) });
}
