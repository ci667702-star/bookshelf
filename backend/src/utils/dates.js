import { env } from './env.js';

// 날짜 전용(@db.Date) 컬럼은 항상 UTC 자정의 Date 로 다룬다.
// 클라이언트와는 'YYYY-MM-DD' 문자열로 주고받는다.

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: env.APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 서비스 기준 시간대의 오늘 'YYYY-MM-DD' */
export function todayKey() {
  return dayFormatter.format(new Date());
}

export function keyToDate(key) {
  return new Date(`${key}T00:00:00.000Z`);
}

export function dateToKey(date) {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

export function todayDate() {
  return keyToDate(todayKey());
}

/** month: 1~12 → [start, endExclusive) UTC 자정 Date */
export function monthRange(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

export function currentYearMonth() {
  const [y, m] = todayKey().split('-').map(Number);
  return { year: y, month: m };
}

export function yearRange(year) {
  return { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year + 1, 0, 1)) };
}
