import { prisma } from '../utils/prisma.js';
import { countedPages, toCm } from './readingService.js';
import { REWARD_STICKERS } from './decorationService.js';

/**
 * 배지 정의 — 조건(metric ≥ goal)을 채우면 획득, reward 스티커가 꾸미기에서 열린다.
 * 한 번 얻은 배지는 기록을 지워도 사라지지 않는다.
 */
export const BADGES = [
  { key: 'first_book', name: '첫 책 꽂기', desc: '책장에 첫 책을 꽂았어요', metric: 'books', goal: 1, reward: null },
  { key: 'first_finish', name: '첫 완독', desc: '책 한 권을 끝까지 읽었어요', metric: 'finished', goal: 1, reward: 'strawberry' },
  { key: 'first_review', name: '첫 독후감', desc: '독후감을 처음 남겼어요', metric: 'reviews', goal: 1, reward: 'letter' },
  { key: 'height_10', name: '10cm 돌파', desc: '책탑이 10cm를 넘었어요 (1,000쪽)', metric: 'heightCm', goal: 10, reward: 'clover' },
  { key: 'streak_7', name: '7일 연속 독서', desc: '7일 동안 하루도 빠짐없이 기록했어요', metric: 'bestStreak', goal: 7, reward: 'rainbow' },
  { key: 'quote_5', name: '문장 수집가', desc: '마음에 남은 문장을 5개 모았어요', metric: 'quotes', goal: 5, reward: 'moon' },
  { key: 'finish_10', name: '완독 10권', desc: '책 10권을 끝까지 읽었어요', metric: 'finished', goal: 10, reward: 'crown' },
  { key: 'timer_1', name: '집중 독서', desc: '독서 타이머로 처음 기록했어요', metric: 'timerLogs', goal: 1, reward: null },
  { key: 'friend_1', name: '첫 친구', desc: '다른 독자를 처음 팔로우했어요', metric: 'following', goal: 1, reward: null },
];

function bestStreak(dates) {
  let best = 0;
  let cur = 0;
  let prev = null;
  for (const d of dates) {
    cur = prev && d - prev === 86400000 ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = d;
  }
  return best;
}

async function metrics(userId) {
  const [records, reviews, quotes, timerLogs, following, logDates] = await Promise.all([
    prisma.readingRecord.findMany({
      where: { userId },
      select: { status: true, currentPage: true, book: { select: { totalPages: true } } },
    }),
    prisma.review.count({ where: { userId } }),
    prisma.quote.count({ where: { userId } }),
    prisma.readingLog.count({ where: { userId, minutes: { not: null } } }),
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.readingLog.findMany({ where: { userId }, select: { date: true }, distinct: ['date'], orderBy: { date: 'asc' } }),
  ]);
  const pages = records.reduce((s, r) => s + countedPages(r.status, r.currentPage, r.book.totalPages), 0);
  return {
    books: records.length,
    finished: records.filter((r) => r.status === 'FINISHED').length,
    heightCm: toCm(pages),
    reviews,
    quotes,
    timerLogs,
    following,
    bestStreak: bestStreak(logDates.map((l) => l.date.getTime())),
  };
}

/** 조건을 채운 배지를 저장하고 전체 배지 현황을 돌려준다 */
export async function syncBadges(userId) {
  const m = await metrics(userId);
  const have = new Set((await prisma.userBadge.findMany({ where: { userId }, select: { badgeKey: true } })).map((b) => b.badgeKey));
  const fresh = BADGES.filter((b) => !have.has(b.key) && m[b.metric] >= b.goal);
  if (fresh.length) {
    await prisma.userBadge.createMany({ data: fresh.map((b) => ({ userId, badgeKey: b.key })), skipDuplicates: true });
  }
  const earned = new Map((await prisma.userBadge.findMany({ where: { userId } })).map((b) => [b.badgeKey, b]));
  const badges = BADGES.map((b) => {
    const e = earned.get(b.key);
    return {
      key: b.key,
      name: b.name,
      desc: b.desc,
      reward: b.reward,
      goal: b.goal,
      progress: Math.min(m[b.metric], b.goal),
      earned: !!e,
      earnedAt: e?.earnedAt ?? null,
      isNew: !!e && !e.seenAt,
    };
  });
  return {
    badges,
    unlockedStickers: badges.filter((b) => b.earned && b.reward).map((b) => b.reward),
  };
}

export async function unlockedStickers(userId) {
  const earned = await prisma.userBadge.findMany({ where: { userId }, select: { badgeKey: true } });
  const keys = new Set(earned.map((b) => b.badgeKey));
  return BADGES.filter((b) => keys.has(b.key) && b.reward).map((b) => b.reward);
}

export async function markBadgesSeen(userId) {
  await prisma.userBadge.updateMany({ where: { userId, seenAt: null }, data: { seenAt: new Date() } });
}

export const LOCKED_STICKERS = REWARD_STICKERS;
