import { prisma } from '../utils/prisma.js';
import { badRequest } from '../utils/httpError.js';
import {
  todayDate,
  todayKey,
  keyToDate,
  monthRange,
  yearRange,
  currentYearMonth,
  dateToKey,
} from '../utils/dates.js';

/** 독서 마라톤: 누적 높이(cm) = 누적 페이지 × 0.01 */
export const PAGE_TO_CM = 0.01;

export const toCm = (pages) => Math.round(pages * PAGE_TO_CM * 100) / 100;
const pct = (value, goal) => (goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0);

/**
 * 한 독서 기록이 마라톤에 기여하는 페이지
 *  - 완독: 전체 페이지
 *  - 읽는 중 / 중단: 실제로 읽은 페이지(현재 페이지)
 *  - 읽고 싶은 책: 0
 * 기록은 (사용자, 책) 당 하나뿐이므로 같은 책이 두 번 집계되지 않는다.
 */
export function countedPages(status, currentPage, totalPages) {
  if (status === 'FINISHED') return totalPages;
  if (status === 'READING' || status === 'STOPPED') return Math.max(0, Math.min(currentPage, totalPages));
  return 0;
}

function assertNotFuture(date, label) {
  if (date && date > todayDate()) throw badRequest(`${label}은(는) 오늘 이후로 선택할 수 없어요.`);
}

/**
 * 독서 상태에 맞게 진행 필드를 정리한다.
 * startDate/finishDate 는 'YYYY-MM-DD' | null | undefined
 */
export function normalizeProgress({ status, currentPage, startDate, finishDate }, totalPages) {
  let nextStatus = status;
  let page = Math.max(0, Math.min(Number(currentPage ?? 0), totalPages));
  let start = startDate ? keyToDate(startDate) : null;
  let finish = finishDate ? keyToDate(finishDate) : null;

  if (nextStatus === 'READING' && totalPages > 0 && page >= totalPages) nextStatus = 'FINISHED';

  switch (nextStatus) {
    case 'WANT_TO_READ':
      page = 0;
      start = null;
      finish = null;
      break;
    case 'READING':
      finish = null;
      if (!start) start = todayDate();
      break;
    case 'FINISHED':
      page = totalPages;
      if (!finish) finish = todayDate();
      if (!start) start = finish;
      break;
    case 'STOPPED':
      finish = null;
      break;
    default:
      throw badRequest('독서 상태가 올바르지 않아요.');
  }

  assertNotFuture(start, '시작일');
  assertNotFuture(finish, '완독일');
  if (start && finish && start > finish) throw badRequest('완독일은 시작일보다 빠를 수 없어요.');

  return { status: nextStatus, currentPage: page, startDate: start, finishDate: finish };
}

/**
 * 로그 합계 = 집계 페이지 가 되도록 맞춘다.
 *  - 늘어난 만큼: 완독이면 완독일, 아니면 오늘 날짜로 자동 로그 추가
 *  - 줄어든 만큼: 최근 로그부터 차감
 * → 달력·이번 달 독서량과 마라톤 누적 페이지가 항상 일치
 */
export async function syncLogsToProgress(tx, recordId) {
  const record = await tx.readingRecord.findUnique({ where: { id: recordId }, include: { book: true } });
  if (!record) return;
  const target = countedPages(record.status, record.currentPage, record.book.totalPages);
  const agg = await tx.readingLog.aggregate({ where: { readingRecordId: recordId }, _sum: { pagesRead: true } });
  const logged = agg._sum.pagesRead ?? 0;
  const delta = target - logged;

  if (delta > 0) {
    const date = record.status === 'FINISHED' && record.finishDate ? record.finishDate : todayDate();
    await tx.readingLog.create({
      data: { readingRecordId: recordId, userId: record.userId, date, pagesRead: delta, isAuto: true },
    });
  } else if (delta < 0) {
    let remaining = -delta;
    const logs = await tx.readingLog.findMany({
      where: { readingRecordId: recordId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    for (const log of logs) {
      if (remaining <= 0) break;
      if (log.pagesRead <= remaining) {
        await tx.readingLog.delete({ where: { id: log.id } });
        remaining -= log.pagesRead;
      } else {
        await tx.readingLog.update({ where: { id: log.id }, data: { pagesRead: log.pagesRead - remaining } });
        remaining = 0;
      }
    }
  }
}

const stackBookSelect = { id: true, title: true, author: true, coverImage: true, totalPages: true };

/** 독서 마라톤 통계 */
export async function getMarathon(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { yearlyGoalBooks: true, monthlyGoalPages: true },
  });
  const records = await prisma.readingRecord.findMany({
    where: { userId, status: { in: ['READING', 'FINISHED', 'STOPPED'] } },
    include: { book: { select: stackBookSelect } },
    orderBy: [{ finishDate: 'asc' }, { createdAt: 'asc' }],
  });

  let totalPages = 0;
  const stack = [];
  for (const r of records) {
    const pages = countedPages(r.status, r.currentPage, r.book.totalPages);
    if (pages <= 0) continue;
    totalPages += pages;
    stack.push({
      recordId: r.id,
      bookId: r.book.id,
      title: r.book.title,
      author: r.book.author,
      coverImage: r.book.coverImage,
      totalPages: r.book.totalPages,
      pages,
      status: r.status,
      finishDate: dateToKey(r.finishDate),
    });
  }

  const { year, month } = currentYearMonth();
  const mr = monthRange(year, month);
  const yr = yearRange(year);
  const [monthAgg, yearFinished] = await Promise.all([
    prisma.readingLog.aggregate({
      where: { userId, date: { gte: mr.start, lt: mr.end } },
      _sum: { pagesRead: true },
    }),
    prisma.readingRecord.count({
      where: { userId, status: 'FINISHED', finishDate: { gte: yr.start, lt: yr.end } },
    }),
  ]);
  const monthPages = monthAgg._sum.pagesRead ?? 0;

  return {
    totalPages,
    heightCm: toCm(totalPages),
    finishedCount: records.filter((r) => r.status === 'FINISHED').length,
    readingCount: records.filter((r) => r.status === 'READING').length,
    monthPages,
    monthHeightCm: toCm(monthPages),
    yearFinished,
    year,
    month,
    goals: {
      yearlyGoalBooks: user.yearlyGoalBooks,
      yearlyRate: pct(yearFinished, user.yearlyGoalBooks),
      monthlyGoalPages: user.monthlyGoalPages,
      monthlyRate: pct(monthPages, user.monthlyGoalPages),
    },
    stack,
  };
}

/** 월별 독서 달력 */
export async function getCalendar(userId, year, month) {
  const { start, end } = monthRange(year, month);
  const [logs, finishedRecords, user] = await Promise.all([
    prisma.readingLog.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { record: { select: { id: true, status: true, book: { select: stackBookSelect } } } },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.readingRecord.findMany({
      where: { userId, status: 'FINISHED', finishDate: { gte: start, lt: end } },
      include: { book: { select: stackBookSelect } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { monthlyGoalPages: true } }),
  ]);

  const days = {};
  const ensure = (key) => (days[key] ??= { date: key, pages: 0, logs: [], finished: [] });

  for (const log of logs) {
    const day = ensure(dateToKey(log.date));
    day.pages += log.pagesRead;
    day.logs.push({
      id: log.id,
      pagesRead: log.pagesRead,
      memo: log.memo,
      isAuto: log.isAuto,
      recordId: log.record.id,
      status: log.record.status,
      book: log.record.book,
    });
  }
  for (const r of finishedRecords) {
    ensure(dateToKey(r.finishDate)).finished.push({ recordId: r.id, rating: r.rating, book: r.book });
  }

  const readingDayKeys = Object.values(days)
    .filter((d) => d.pages > 0)
    .map((d) => d.date)
    .sort();
  let bestStreak = 0;
  let streak = 0;
  let prev = null;
  for (const key of readingDayKeys) {
    const cur = keyToDate(key);
    streak = prev && cur - prev === 86400000 ? streak + 1 : 1;
    bestStreak = Math.max(bestStreak, streak);
    prev = cur;
  }

  const totalPages = logs.reduce((s, l) => s + l.pagesRead, 0);
  return {
    year,
    month,
    today: todayKey(),
    days,
    stats: {
      totalPages,
      heightCm: toCm(totalPages),
      readingDays: readingDayKeys.length,
      booksRead: new Set(logs.map((l) => l.readingRecordId)).size,
      finishedCount: finishedRecords.length,
      bestStreak,
      monthlyGoalPages: user.monthlyGoalPages,
      goalRate: pct(totalPages, user.monthlyGoalPages),
    },
  };
}

/** 독서 기록 배열의 요약 통계 */
export function summarizeRecords(records) {
  let pages = 0;
  let finished = 0;
  for (const r of records) {
    pages += countedPages(r.status, r.currentPage, r.book.totalPages);
    if (r.status === 'FINISHED') finished += 1;
  }
  return { books: records.length, finished, pages, heightCm: toCm(pages) };
}
