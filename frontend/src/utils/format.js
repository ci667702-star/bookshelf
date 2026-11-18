const pad = (n) => String(n).padStart(2, '0');

/** 로컬 기준 오늘 'YYYY-MM-DD' */
export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toKey(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** '2026-11-18' → '11월 18일' (연도가 다르면 연도 포함) */
export function formatDay(key, { withYear = false } = {}) {
  if (!key) return '';
  const [y, m, d] = key.slice(0, 10).split('-').map(Number);
  const thisYear = new Date().getFullYear();
  return withYear || y !== thisYear ? `${y}년 ${m}월 ${d}일` : `${m}월 ${d}일`;
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return formatDateTime(iso);
}

export function formatTodayLong() {
  const d = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

export const num = (n) => (n ?? 0).toLocaleString('ko-KR');

export function cm(pages) {
  const v = Math.round((pages ?? 0) * 0.01 * 100) / 100;
  return v.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
}

export function progressPct(record) {
  if (!record?.book?.totalPages) return 0;
  if (record.status === 'FINISHED') return 100;
  return Math.min(100, Math.round((record.currentPage / record.book.totalPages) * 100));
}
