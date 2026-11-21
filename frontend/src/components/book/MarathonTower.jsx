import { Link } from 'react-router-dom';
import { coverPalette, hashString } from '../../utils/color.js';
import { num } from '../../utils/format.js';

/** 쌓인 높이를 실감 나게: 일상 사물 이정표 */
export const MILESTONES = [
  { cm: 3, label: '딸기 한 알' },
  { cm: 10, label: '머그컵 하나' },
  { cm: 15, label: '스마트폰 세로 길이' },
  { cm: 30, label: '30cm 자' },
  { cm: 46, label: '앉아 있는 고양이' },
  { cm: 75, label: '책상 높이' },
  { cm: 100, label: '1미터' },
  { cm: 165, label: '어른 키' },
  { cm: 250, label: '방 천장' },
  { cm: 500, label: '기린 키' },
  { cm: 1000, label: '아파트 3층 높이' },
  { cm: 3000, label: '아파트 10층 높이' },
];

export function milestoneInfo(heightCm) {
  const reached = [...MILESTONES].reverse().find((m) => heightCm >= m.cm) ?? null;
  const next = MILESTONES.find((m) => heightCm < m.cm) ?? null;
  const remainCm = next ? Math.round((next.cm - heightCm) * 100) / 100 : 0;
  return { reached, next, remainCm, remainPages: Math.ceil(remainCm * 100) };
}

const MAJOR_STEPS = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

/**
 * 독서 마라톤 책탑 — 읽은 페이지만큼 책이 쌓이고, 옆의 줄자로 높이(cm)를 잰다.
 * 누적 높이(cm) = 누적 페이지 × 0.01
 */
export default function MarathonTower({ stack = [], totalPages = 0, heightCm = 0, maxHeight = 300, animate = true, compact = false }) {
  if (!stack.length || totalPages <= 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-[3px] bg-milk px-4 py-10 text-center">
        <div className="flex h-24 items-end gap-3">
          <div className="ruler-ticks h-24 w-6 rounded-sm bg-butter" style={{ '--tick-major': '24px' }} />
          <div className="h-3 w-24 rounded-sm border-[1.5px] border-dashed border-kraft-deep" />
        </div>
        <p className="font-serif text-[16px]">아직 쌓인 책이 없어요</p>
        <p className="text-[13px] text-ink-soft">책을 읽으면 100쪽마다 1cm씩 올라가요.</p>
      </div>
    );
  }

  // 슬랩 두께: 페이지에 비례, 최소 두께 보장 후 전체 높이에 맞춰 축소
  const basePerPage = compact ? 0.09 : 0.12;
  const minT = compact ? 5 : 7;
  let thick = stack.map((s) => Math.max(minT, s.pages * basePerPage));
  const sum = thick.reduce((a, b) => a + b, 0);
  if (sum > maxHeight) thick = thick.map((t) => (t * maxHeight) / sum);
  const H = thick.reduce((a, b) => a + b, 0);
  const pxPerCm = H / heightCm;

  const major = MAJOR_STEPS.find((s) => s * pxPerCm >= (compact ? 22 : 30)) ?? 1000;
  const rulerH = H + (compact ? 24 : 36);
  const majors = [];
  for (let v = 0; v * pxPerCm <= rulerH; v += major) majors.push(Math.round(v * 100) / 100);
  const minorStep = major / 5;
  const minors = [];
  for (let v = minorStep; v * pxPerCm <= rulerH; v += minorStep) {
    if (Math.abs(v / major - Math.round(v / major)) > 0.01) minors.push(v);
  }

  return (
    <div className={`flex items-end ${compact ? 'gap-3' : 'gap-5'}`}>
      {/* 줄자 */}
      <div
        className="relative w-11 shrink-0 rounded-t-md border-[1.5px] border-b-0 border-ink/80 bg-butter"
        style={{ height: rulerH }}
        aria-hidden
      >
        {minors.map((v) => (
          <span key={`m${v}`} className="absolute right-0 h-px w-2 bg-ink/50" style={{ bottom: v * pxPerCm }} />
        ))}
        {majors.map((v) => (
          <span key={v} className="absolute right-0 flex items-center" style={{ bottom: v * pxPerCm - 0.75 }}>
            <span className="mr-1 text-[9.5px] leading-none font-bold text-ink tabular-nums">{v}</span>
            <span className="h-[1.5px] w-3.5 bg-ink" />
          </span>
        ))}
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-ink-soft">cm</span>
      </div>

      {/* 책탑 */}
      <div className="relative flex min-w-0 flex-1 flex-col items-center">
        <div className="mb-2 flex items-center gap-1.5 rounded-full border-[1.5px] border-ink/80 bg-paper px-3 py-1 shadow-[var(--shadow-page)]">
          <span className={`numeral text-ink ${compact ? 'text-[18px]' : 'text-[24px]'} leading-none`}>{heightCm}</span>
          <span className="text-[12px] font-bold text-ink-soft">cm</span>
        </div>
        <span className="mb-1 h-3 w-px border-l-[1.5px] border-dashed border-ink/40" aria-hidden />
        <ol className="flex w-full flex-col-reverse items-center" aria-label={`쌓인 책 ${stack.length}권, 총 ${num(totalPages)}쪽`}>
          {stack.map((s, i) => {
            const pal = coverPalette(s.bookId || s.title);
            const h = hashString(s.recordId);
            const width = 58 + (h % 34);
            const offset = (h % 15) - 7;
            const t = thick[i];
            const delay = animate ? Math.min(i * 55, 1400) : 0;
            return (
              <li
                key={s.recordId}
                className={animate ? 'animate-drop-in' : ''}
                style={{
                  width: `${width}%`,
                  marginLeft: offset * 2,
                  animationDelay: `${delay}ms`,
                  '--tilt': `${((h % 7) - 3) * 0.35}deg`,
                }}
              >
                <Link
                  to={`/books/${s.bookId}`}
                  title={`${s.title} · ${num(s.pages)}쪽${s.status !== 'FINISHED' ? ' (읽는 중)' : ''}`}
                  className="relative flex items-center overflow-hidden rounded-[3px] border-[1.5px] border-ink/75 px-2 transition hover:brightness-105"
                  style={{ height: t, background: pal.bg, color: pal.fg, opacity: s.status === 'FINISHED' ? 1 : 0.85 }}
                >
                  <span className="absolute inset-y-0 left-2 w-[3px]" style={{ background: pal.band }} aria-hidden />
                  {t >= 15 && (
                    <span className="ml-3 truncate font-serif text-[11px] leading-none font-bold">{s.title}</span>
                  )}
                  {s.status !== 'FINISHED' && t >= 15 && (
                    <span className="ml-auto pl-1 text-[9.5px] font-semibold opacity-80">읽는 중</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
        <div className="h-2.5 w-[112%] rounded-full bg-kraft-deep" aria-hidden />
      </div>
    </div>
  );
}
