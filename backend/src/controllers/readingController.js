import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/httpError.js';
import { serializeLog, serializeRecord } from '../utils/serializers.js';
import { dateKey, optionalDate, optionalText, rating, readingStatus } from '../utils/validators.js';
import { currentYearMonth, dateToKey, keyToDate, todayDate, todayKey } from '../utils/dates.js';
import {
  getCalendar,
  getMarathon,
  normalizeProgress,
  syncLogsToProgress,
} from '../services/readingService.js';

export const listReadingQuery = z.object({ status: readingStatus.optional() });

export const createReadingSchema = z.object({
  bookId: z.string().min(1).max(40),
  bookshelfId: z.string().max(40).optional(),
  status: readingStatus.default('WANT_TO_READ'),
  currentPage: z.coerce.number().int().min(0).max(20000).optional().default(0),
  rating,
  oneLineReview: optionalText(150),
  startDate: optionalDate,
  finishDate: optionalDate,
});

export const updateReadingSchema = z
  .object({
    bookshelfId: z.string().max(40),
    status: readingStatus,
    currentPage: z.coerce.number().int().min(0).max(20000),
    rating,
    oneLineReview: optionalText(150),
    startDate: optionalDate,
    finishDate: optionalDate,
  })
  .partial();

export const createLogSchema = z
  .object({
    date: dateKey.optional(),
    pagesRead: z.coerce.number().int().min(1, '1쪽 이상 입력해 주세요.').max(5000).optional(),
    toPage: z.coerce.number().int().min(1).max(20000).optional(),
    memo: optionalText(200),
  })
  .refine((v) => v.pagesRead || v.toPage, { message: '읽은 쪽수나 읽은 곳까지의 페이지를 입력해 주세요.', path: ['pagesRead'] });

export const calendarQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export const logIdParam = z.object({ logId: z.string().min(1).max(40) });

const recordInclude = { book: true, bookshelf: { select: { id: true, name: true, isPublic: true } } };

async function getOwnRecord(id, userId) {
  const record = await prisma.readingRecord.findUnique({ where: { id }, include: { book: true } });
  if (!record) throw notFound('독서 기록을 찾을 수 없어요.');
  if (record.userId !== userId) throw forbidden('내 독서 기록만 바꿀 수 있어요.');
  return record;
}

async function assertOwnShelf(userId, bookshelfId) {
  const shelf = await prisma.bookshelf.findUnique({ where: { id: bookshelfId }, select: { ownerId: true } });
  if (!shelf || shelf.ownerId !== userId) throw badRequest('내 책장을 선택해 주세요.');
}

export async function listReading(req, res) {
  const { status } = req.valid.query;
  const records = await prisma.readingRecord.findMany({
    where: { userId: req.user.id, ...(status ? { status } : {}) },
    include: recordInclude,
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ items: records.map(serializeRecord) });
}

/** 기록이 없는 내 책에 독서 기록 만들기 */
export async function createReading(req, res) {
  const userId = req.user.id;
  const body = req.valid.body;
  const book = await prisma.book.findUnique({ where: { id: body.bookId } });
  if (!book || book.createdById !== userId) throw notFound('내가 등록한 책을 찾을 수 없어요.');
  const exists = await prisma.readingRecord.findUnique({
    where: { userId_bookId: { userId, bookId: book.id } },
    select: { id: true },
  });
  if (exists) throw conflict('이미 독서 기록이 있는 책이에요.');

  let bookshelfId = body.bookshelfId;
  if (bookshelfId) await assertOwnShelf(userId, bookshelfId);
  else {
    const first = await prisma.bookshelf.findFirst({ where: { ownerId: userId }, orderBy: { createdAt: 'asc' } });
    bookshelfId = first?.id ?? null;
  }

  const progress = normalizeProgress(body, book.totalPages);
  const record = await prisma.$transaction(async (tx) => {
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
    return tx.readingRecord.findUnique({ where: { id: rec.id }, include: recordInclude });
  });
  res.status(201).json({ record: serializeRecord(record) });
}

export async function updateReading(req, res) {
  const record = await getOwnRecord(req.valid.params.id, req.user.id);
  const body = req.valid.body;
  const data = {};
  if (body.bookshelfId !== undefined) {
    await assertOwnShelf(req.user.id, body.bookshelfId);
    data.bookshelfId = body.bookshelfId;
  }
  if (body.rating !== undefined) data.rating = body.rating;
  if (body.oneLineReview !== undefined) data.oneLineReview = body.oneLineReview;

  const progress = normalizeProgress(
    {
      status: body.status ?? record.status,
      currentPage: body.currentPage ?? record.currentPage,
      startDate: body.startDate !== undefined ? body.startDate : dateToKey(record.startDate),
      finishDate: body.finishDate !== undefined ? body.finishDate : dateToKey(record.finishDate),
    },
    record.book.totalPages
  );

  const updated = await prisma.$transaction(async (tx) => {
    await tx.readingRecord.update({ where: { id: record.id }, data: { ...data, ...progress } });
    await syncLogsToProgress(tx, record.id);
    return tx.readingRecord.findUnique({ where: { id: record.id }, include: recordInclude });
  });
  res.json({ record: serializeRecord(updated) });
}

/** 독서 기록 삭제 — 개인 책은 기록과 1:1 이므로 책도 함께 정리 */
export async function deleteReading(req, res) {
  const record = await getOwnRecord(req.valid.params.id, req.user.id);
  await prisma.$transaction(async (tx) => {
    await tx.readingRecord.delete({ where: { id: record.id } });
    if (record.book.createdById === req.user.id) {
      await tx.book.delete({ where: { id: record.bookId } });
    }
  });
  res.json({ ok: true });
}

export async function listLogs(req, res) {
  const record = await getOwnRecord(req.valid.params.id, req.user.id);
  const logs = await prisma.readingLog.findMany({
    where: { readingRecordId: record.id },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  res.json({ items: logs.map(serializeLog) });
}

/** 오늘(또는 특정 날짜) 읽은 페이지 기록 */
/**
 * 독서 로그 한 건 저장 (직접 기록 · 타이머 공용)
 * - pagesRead 또는 toPage 로 진행 페이지를 올리고, 끝까지 읽으면 완독 처리
 * - allowZeroPages: 타이머로 "시간만" 기록할 때 0쪽 허용
 */
async function applyReadingLog(record, { dateKey: dateK = todayKey(), pagesRead, toPage, memo, minutes = null, allowZeroPages = false }) {
  const total = record.book.totalPages;
  const date = keyToDate(dateK);
  if (date > todayDate()) throw badRequest('미래 날짜에는 기록할 수 없어요.', { date: '오늘 이후 날짜예요.' });

  const base = record.status === 'FINISHED' ? total : record.status === 'WANT_TO_READ' ? 0 : record.currentPage;
  const noPages = pagesRead === undefined && toPage === undefined;
  if (!(allowZeroPages && noPages) && base >= total) throw badRequest('이미 마지막 페이지까지 읽은 책이에요.');

  const target = noPages ? base : toPage !== undefined ? toPage : base + pagesRead;
  const newPage = Math.min(Math.max(target, base), total);
  const added = newPage - base;
  if (added <= 0 && !(allowZeroPages && noPages)) {
    throw badRequest(`지금까지 ${base}쪽을 읽었어요. 그보다 뒤 페이지를 입력해 주세요.`, {
      toPage: `${base}쪽보다 큰 값을 입력해 주세요.`,
    });
  }

  const finished = newPage >= total;
  return prisma.$transaction(async (tx) => {
    const log = await tx.readingLog.create({
      data: { readingRecordId: record.id, userId: record.userId, date, pagesRead: added, memo: memo ?? null, minutes },
    });
    const updated = await tx.readingRecord.update({
      where: { id: record.id },
      data: {
        currentPage: newPage,
        status: finished ? 'FINISHED' : 'READING',
        startDate: record.startDate && record.startDate <= date ? record.startDate : date,
        finishDate: finished ? date : null,
      },
      include: recordInclude,
    });
    return { log, updated, finished };
  });
}

/** 오늘(또는 특정 날짜) 읽은 페이지 기록 */
export async function createLog(req, res) {
  const record = await getOwnRecord(req.valid.params.id, req.user.id);
  const { date, pagesRead, toPage, memo } = req.valid.body;
  const result = await applyReadingLog(record, { dateKey: date, pagesRead, toPage, memo });
  res.status(201).json({ log: serializeLog(result.log), record: serializeRecord(result.updated), finished: result.finished });
}

// ───────── 독서 타이머 (서버에 시작 시각을 저장 → 새로고침 · 다른 기기에서도 유지) ─────────

export const stopTimerSchema = z.object({
  pagesRead: z.coerce.number().int().min(1).max(5000).optional(),
  toPage: z.coerce.number().int().min(1).max(20000).optional(),
  memo: optionalText(200),
});

const sessionInclude = { record: { include: { book: true } } };
const serializeSession = (s) =>
  s
    ? {
        id: s.id,
        startedAt: s.startedAt,
        record: serializeRecord(s.record),
      }
    : null;

export async function getTimer(req, res) {
  const session = await prisma.readingSession.findUnique({ where: { userId: req.user.id }, include: sessionInclude });
  res.json({ session: serializeSession(session), serverNow: new Date() });
}

export async function startTimer(req, res) {
  const record = await getOwnRecord(req.valid.params.id, req.user.id);
  if (record.status === 'FINISHED') throw badRequest('이미 다 읽은 책이에요.');
  const existing = await prisma.readingSession.findUnique({ where: { userId: req.user.id }, include: sessionInclude });
  if (existing) {
    if (existing.readingRecordId === record.id) return res.json({ session: serializeSession(existing) });
    throw conflict(`「${existing.record.book.title}」 타이머가 이미 돌아가고 있어요. 먼저 멈춰 주세요.`);
  }
  const session = await prisma.readingSession.create({
    data: { userId: req.user.id, readingRecordId: record.id },
    include: sessionInclude,
  });
  res.status(201).json({ session: serializeSession(session) });
}

export async function stopTimer(req, res) {
  const session = await prisma.readingSession.findUnique({ where: { userId: req.user.id }, include: sessionInclude });
  if (!session) throw notFound('돌아가고 있는 타이머가 없어요.');
  const minutes = Math.max(1, Math.round((Date.now() - session.startedAt.getTime()) / 60000));
  const { pagesRead, toPage, memo } = req.valid.body;
  const record = await prisma.readingRecord.findUnique({ where: { id: session.readingRecordId }, include: { book: true } });
  const result = await applyReadingLog(record, { pagesRead, toPage, memo, minutes, allowZeroPages: true });
  await prisma.readingSession.delete({ where: { id: session.id } });
  res.json({ log: serializeLog(result.log), record: serializeRecord(result.updated), finished: result.finished, minutes });
}

export async function cancelTimer(req, res) {
  await prisma.readingSession.deleteMany({ where: { userId: req.user.id } });
  res.json({ ok: true });
}

/** 잘못 남긴 로그 삭제 → 진행 페이지도 그만큼 되돌림 */
export async function deleteLog(req, res) {
  const log = await prisma.readingLog.findUnique({
    where: { id: req.valid.params.logId },
    include: { record: { include: { book: true } } },
  });
  if (!log) throw notFound('독서 기록을 찾을 수 없어요.');
  if (log.userId !== req.user.id) throw forbidden('내 기록만 지울 수 있어요.');

  const rec = log.record;
  const total = rec.book.totalPages;
  const base = rec.status === 'FINISHED' ? total : rec.currentPage;
  const newPage = Math.max(0, base - log.pagesRead);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.readingLog.delete({ where: { id: log.id } });
    return tx.readingRecord.update({
      where: { id: rec.id },
      data: {
        currentPage: newPage,
        ...(rec.status === 'FINISHED' && newPage < total ? { status: 'READING', finishDate: null } : {}),
      },
      include: recordInclude,
    });
  });
  res.json({ ok: true, record: serializeRecord(updated) });
}

export async function calendar(req, res) {
  const now = currentYearMonth();
  const year = req.valid.query.year ?? now.year;
  const month = req.valid.query.month ?? now.month;
  res.json(await getCalendar(req.user.id, year, month));
}

export async function marathon(req, res) {
  res.json(await getMarathon(req.user.id));
}
