import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/httpError.js';
import {
  publicUserSelect,
  serializeBook,
  serializeLog,
  serializeRecord,
  serializeReview,
  reviewInclude,
} from '../utils/serializers.js';
import { optionalDate, optionalImage, optionalText, rating, readingStatus } from '../utils/validators.js';
import { canViewRecord, requireSharedMember, reviewVisibleWhere } from '../services/accessService.js';
import { normalizeProgress, syncLogsToProgress, countedPages } from '../services/readingService.js';
import { dateToKey } from '../utils/dates.js';

/** 같은 책 판별용 키: 공백/대소문자/일부 기호 무시 */
export function makeTitleKey(title, author) {
  const norm = (s) => s.toLowerCase().replace(/[\s·.,:;!?'"«»<>《》〈〉「」『』()[\]{}\-_]/g, '');
  return `${norm(title)}|${norm(author)}`.slice(0, 330);
}

const bookFields = {
  title: z.string().trim().min(1, '책 제목을 입력해 주세요.').max(200),
  author: z.string().trim().min(1, '저자를 입력해 주세요.').max(120),
  publisher: optionalText(120),
  coverImage: optionalImage,
  totalPages: z.coerce
    .number({ message: '전체 페이지 수를 입력해 주세요.' })
    .int('페이지 수는 정수로 입력해 주세요.')
    .min(1, '전체 페이지 수는 1 이상이어야 해요.')
    .max(20000, '페이지 수가 너무 커요.'),
};

const recordFields = {
  bookshelfId: z.string().max(40).optional(),
  status: readingStatus.default('WANT_TO_READ'),
  currentPage: z.coerce.number().int().min(0).max(20000).optional().default(0),
  rating,
  oneLineReview: optionalText(150),
  startDate: optionalDate,
  finishDate: optionalDate,
};

export const createBookSchema = z.object({
  ...bookFields,
  ...recordFields,
  sharedBookshelfId: z.string().max(40).optional(),
});

export const updateBookSchema = z
  .object({ ...bookFields, ...recordFields, status: readingStatus })
  .partial();

export const listBooksQuery = z.object({
  status: readingStatus.optional(),
  bookshelfId: z.string().max(40).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['recent', 'title', 'rating', 'progress']).default('recent'),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

async function resolveOwnShelfId(userId, bookshelfId) {
  if (bookshelfId) {
    const shelf = await prisma.bookshelf.findUnique({ where: { id: bookshelfId }, select: { ownerId: true } });
    if (!shelf || shelf.ownerId !== userId) throw badRequest('내 책장을 선택해 주세요.', { bookshelfId: '내 책장을 선택해 주세요.' });
    return bookshelfId;
  }
  const first = await prisma.bookshelf.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (first) return first.id;
  const created = await prisma.bookshelf.create({ data: { ownerId: userId, name: '나의 책장' } });
  return created.id;
}

const orderByFor = (sort) =>
  ({
    recent: [{ createdAt: 'desc' }],
    title: [{ book: { title: 'asc' } }],
    rating: [{ rating: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    progress: [{ updatedAt: 'desc' }],
  })[sort];

/** 내 책 목록 (= 내 독서 기록 + 책 정보) */
export async function listBooks(req, res) {
  const { status, bookshelfId, q, sort, limit } = req.valid.query;
  const records = await prisma.readingRecord.findMany({
    where: {
      userId: req.user.id,
      ...(status ? { status } : {}),
      ...(bookshelfId ? { bookshelfId } : {}),
      ...(q
        ? {
            book: {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { author: { contains: q, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    },
    include: { book: true, bookshelf: { select: { id: true, name: true, isPublic: true } } },
    orderBy: orderByFor(sort),
    take: limit,
  });
  res.json({ items: records.map(serializeRecord) });
}

/** 책 등록: 책 + 독서 기록을 함께 만들고 책장에 꽂는다 */
export async function createBook(req, res) {
  const userId = req.user.id;
  const body = req.valid.body;
  const bookshelfId = await resolveOwnShelfId(userId, body.bookshelfId);
  if (body.sharedBookshelfId) await requireSharedMember(body.sharedBookshelfId, userId);

  const titleKey = makeTitleKey(body.title, body.author);
  const existing = await prisma.book.findUnique({
    where: { createdById_titleKey: { createdById: userId, titleKey } },
    include: { records: { where: { userId }, select: { id: true } } },
  });
  if (existing) {
    throw conflict('이미 내 책장에 있는 책이에요.', { title: '이미 등록한 책이에요.', existingBookId: existing.id });
  }

  const progress = normalizeProgress(body, body.totalPages);

  try {
    const record = await prisma.$transaction(async (tx) => {
      const book = await tx.book.create({
        data: {
          createdById: userId,
          title: body.title,
          author: body.author,
          publisher: body.publisher ?? null,
          coverImage: body.coverImage ?? null,
          totalPages: body.totalPages,
          titleKey,
        },
      });
      const rec = await tx.readingRecord.create({
        data: {
          userId,
          bookId: book.id,
          bookshelfId,
          rating: body.rating ?? null,
          oneLineReview: body.oneLineReview ?? null,
          ...progress,
        },
      });
      await syncLogsToProgress(tx, rec.id);
      if (body.sharedBookshelfId) {
        await tx.sharedBookshelfItem.create({
          data: { bookshelfId: body.sharedBookshelfId, readingRecordId: rec.id, addedById: userId },
        });
      }
      return tx.readingRecord.findUnique({
        where: { id: rec.id },
        include: { book: true, bookshelf: { select: { id: true, name: true, isPublic: true } } },
      });
    });
    res.status(201).json({ record: serializeRecord(record) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw conflict('이미 내 책장에 있는 책이에요.', { title: '이미 등록한 책이에요.' });
    }
    throw err;
  }
}

/** 책 상세 — 내 책이면 전체 기록, 다른 사람 책이면 공개 범위만 */
export async function getBook(req, res) {
  const viewerId = req.user?.id;
  const book = await prisma.book.findUnique({
    where: { id: req.valid.params.id },
    include: {
      createdBy: { select: publicUserSelect },
      records: {
        include: { bookshelf: { select: { id: true, name: true, isPublic: true } } },
        take: 1,
      },
    },
  });
  if (!book) throw notFound('책을 찾을 수 없어요.');
  const record = book.records[0] ?? null;
  const isMine = book.createdById === viewerId;

  if (!isMine) {
    if (!record || !(await canViewRecord(record, viewerId))) {
      throw notFound('비공개이거나 존재하지 않는 책이에요.');
    }
  }

  const [logs, reviews, sharedItems] = await Promise.all([
    isMine && record
      ? prisma.readingLog.findMany({
          where: { readingRecordId: record.id },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          take: 60,
        })
      : [],
    prisma.review.findMany({
      where: { AND: [{ bookId: book.id }, reviewVisibleWhere(viewerId)] },
      include: reviewInclude(viewerId),
      orderBy: { createdAt: 'desc' },
    }),
    record
      ? prisma.sharedBookshelfItem.findMany({
          where: {
            readingRecordId: record.id,
            bookshelf: viewerId
              ? { OR: [{ isPublic: true }, { members: { some: { userId: viewerId } } }] }
              : { isPublic: true },
          },
          select: { id: true, bookshelf: { select: { id: true, name: true } } },
        })
      : [],
  ]);

  res.json({
    book: serializeBook(book),
    owner: book.createdBy,
    isMine,
    record: record
      ? {
          ...serializeRecord(record),
          countedPages: countedPages(record.status, record.currentPage, book.totalPages),
          // 다른 사람의 책장 위치가 비공개면 숨김
          bookshelf: isMine || record.bookshelf?.isPublic ? record.bookshelf : null,
        }
      : null,
    logs: logs.map(serializeLog),
    reviews: reviews.map((r) => serializeReview(r, viewerId)),
    sharedShelves: sharedItems.map((i) => i.bookshelf),
  });
}

async function getOwnBook(bookId, userId) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: { records: { where: { userId }, take: 1 } },
  });
  if (!book) throw notFound('책을 찾을 수 없어요.');
  if (book.createdById !== userId) throw forbidden('내가 등록한 책만 수정할 수 있어요.');
  return book;
}

export async function updateBook(req, res) {
  const userId = req.user.id;
  const book = await getOwnBook(req.valid.params.id, userId);
  const body = req.valid.body;
  const record = book.records[0];

  const bookData = {};
  for (const key of ['title', 'author', 'publisher', 'coverImage', 'totalPages']) {
    if (body[key] !== undefined) bookData[key] = body[key];
  }
  if (bookData.title || bookData.author) {
    bookData.titleKey = makeTitleKey(bookData.title ?? book.title, bookData.author ?? book.author);
    const dup = await prisma.book.findFirst({
      where: { createdById: userId, titleKey: bookData.titleKey, NOT: { id: book.id } },
      select: { id: true },
    });
    if (dup) throw conflict('같은 제목과 저자의 책이 이미 있어요.', { title: '이미 등록한 책이에요.' });
  }
  const totalPages = bookData.totalPages ?? book.totalPages;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.book.update({ where: { id: book.id }, data: bookData });
    if (record) {
      const recordData = {};
      if (body.bookshelfId !== undefined) recordData.bookshelfId = await resolveOwnShelfId(userId, body.bookshelfId);
      if (body.rating !== undefined) recordData.rating = body.rating;
      if (body.oneLineReview !== undefined) recordData.oneLineReview = body.oneLineReview;

      const progress = normalizeProgress(
        {
          status: body.status ?? record.status,
          currentPage: body.currentPage ?? record.currentPage,
          startDate: body.startDate !== undefined ? body.startDate : dateToKey(record.startDate),
          finishDate: body.finishDate !== undefined ? body.finishDate : dateToKey(record.finishDate),
        },
        totalPages
      );
      await tx.readingRecord.update({ where: { id: record.id }, data: { ...recordData, ...progress } });
      await syncLogsToProgress(tx, record.id);
      return tx.readingRecord.findUnique({
        where: { id: record.id },
        include: { book: true, bookshelf: { select: { id: true, name: true, isPublic: true } } },
      });
    }
    return null;
  });

  res.json({ record: serializeRecord(updated), book: serializeBook(updated?.book) });
}

export async function deleteBook(req, res) {
  const book = await getOwnBook(req.valid.params.id, req.user.id);
  // 독서 기록, 로그, 독후감, 공유 책장 항목은 Cascade 로 함께 삭제
  await prisma.book.delete({ where: { id: book.id } });
  res.json({ ok: true });
}
