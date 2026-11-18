import { useMemo } from 'react';
import BookCover from '../book/BookCover.jsx';
import { toKey } from '../../utils/format.js';
import { tilt } from '../../utils/color.js';

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function buildWeeks(year, month) {
  const first = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const PIN_Y = 22; // 칸 위에서 핀까지 (viewBox 100 기준 근사값)

/** 완독한 날 핀끼리 잇는 빨간 실 */
function StringLine({ points, rows }) {
  if (points.length < 2) return null;
  const d = points
    .map((p, i) => {
      const x = (p.col + 0.5) * 100;
      const y = p.row * 100 + PIN_Y;
      if (i === 0) return `M${x} ${y}`;
      const prev = points[i - 1];
      const px = (prev.col + 0.5) * 100;
      const py = prev.row * 100 + PIN_Y;
      return `Q${(px + x) / 2} ${Math.max(py, y) + 22} ${x} ${y}`;
    })
    .join(' ');
  return (
    <svg className="pointer-events-none absolute inset-0 z-30 h-full w-full" viewBox={`0 0 700 ${rows * 100}`} preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke="#C8423B" strokeWidth="2.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={d} fill="none" stroke="#F08A84" strokeWidth="1" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Pin() {
  return (
    <span aria-hidden className="absolute -top-2 left-1/2 z-40 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[1.5px] border-[#7d2622] bg-pin">
      <span className="absolute top-[2px] left-[2px] h-1 w-1 rounded-full bg-white/80" />
    </span>
  );
}

/**
 * 월 달력 그리드
 * days: { 'YYYY-MM-DD': { pages, logs:[{book}], finished:[{book}] } }
 */
export default function MonthGrid({ year, month, days = {}, today, selected, onSelect, variant = 'full' }) {
  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);
  const mini = variant === 'mini';

  const finishedPoints = [];
  weeks.forEach((w, row) =>
    w.forEach((d, col) => {
      if (d && days[toKey(year, month, d)]?.finished?.length) finishedPoints.push({ row, col });
    })
  );

  return (
    <div>
      <div className="grid grid-cols-7 border-b-[1.5px] border-ink/20 pb-1.5">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`text-center font-pixel ${mini ? 'text-[11px]' : 'text-[12.5px]'} ${i === 0 ? 'text-berry' : i === 6 ? 'text-link' : 'text-ink-soft'}`}
          >
            {w}
          </div>
        ))}
      </div>
      <div className="relative">
        {!mini && <StringLine points={finishedPoints} rows={weeks.length} />}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-ink/10 last:border-b-0">
            {week.map((d, di) => {
              if (!d) return <div key={di} className={mini ? 'h-9' : 'min-h-[88px] sm:min-h-[124px]'} />;
              const key = toKey(year, month, d);
              const info = days[key];
              const isToday = key === today;
              const isSel = key === selected;
              const finished = info?.finished ?? [];
              const reading = info
                ? [...new Map(info.logs.map((x) => [x.book.id, x.book])).values()].filter((b) => !finished.some((f) => f.book.id === b.id))
                : [];
              const label = `${month}월 ${d}일${info?.pages ? `, ${info.pages}쪽 읽음` : ''}${finished.length ? ', 완독한 날' : ''}`;

              if (mini) {
                return (
                  <button
                    key={di}
                    type="button"
                    onClick={() => onSelect?.(key)}
                    aria-label={label}
                    className="flex h-9 flex-col items-center justify-center rounded-[4px] transition hover:bg-kraft/60"
                  >
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full font-pixel text-[11px] ${
                        isToday ? 'bg-ink text-white' : info?.pages ? 'border-[1.5px] border-ink/70 bg-rose' : 'text-ink-soft'
                      }`}
                    >
                      {d}
                    </span>
                    {finished.length > 0 && <span className="-mt-0.5 h-1.5 w-1.5 rounded-full bg-pin" aria-hidden />}
                  </button>
                );
              }

              const feature = finished[0]?.book;
              return (
                <button
                  key={di}
                  type="button"
                  onClick={() => onSelect?.(key)}
                  aria-label={label}
                  aria-pressed={isSel}
                  className={`relative flex min-h-[88px] flex-col items-stretch p-1 text-left transition sm:min-h-[124px] sm:p-1.5 ${
                    isSel ? 'z-20 rounded-[6px] bg-butter/70 outline-2 outline-ink outline-dashed' : 'hover:bg-kraft/50'
                  }`}
                >
                  <span className="flex w-full items-center justify-between gap-1">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full font-pixel text-[12px] sm:h-7 sm:w-7 sm:text-[14px] ${
                        isToday ? 'bg-ink text-white' : di === 0 ? 'text-berry' : 'text-ink'
                      }`}
                    >
                      {d}
                    </span>
                    {info?.pages > 0 && (
                      <span className="hidden rounded-full bg-paper px-1 font-pixel text-[10px] whitespace-nowrap text-cocoa-deep lg:inline">{info.pages}쪽</span>
                    )}
                  </span>

                  {feature ? (
                    // 완독한 날: 핀으로 꽂은 폴라로이드 + 손글씨 날짜
                    <span
                      className="absolute top-[26px] left-1/2 z-20 block w-[40px] border-[1.5px] border-ink/80 bg-white p-[2px] pb-0 sm:top-[30px] sm:w-[64px] sm:p-[4px] sm:pb-0"
                      style={{ transform: `translateX(-50%) rotate(${tilt(feature.id + key, 6)}deg)` }}
                    >
                      <Pin />
                      <BookCover book={feature} className="aspect-[3/4] w-full" rounded="rounded-none" shadow={false} />
                      <span className="hand block truncate text-center text-[10px] leading-[1.4] text-ink sm:text-[14px]">
                        {month}월 {d}일
                      </span>
                    </span>
                  ) : (
                    reading.length > 0 && (
                      <span className="mt-1 flex w-full flex-1 items-start justify-center gap-0.5">
                        {reading.slice(0, 2).map((b, i) => (
                          <span
                            key={b.id}
                            className={`block border border-ink/60 bg-white p-[2px] pb-[4px] ${i === 1 ? 'hidden sm:block' : ''}`}
                            style={{ transform: `rotate(${tilt(b.id + key, 5)}deg)` }}
                          >
                            <BookCover book={b} className="h-7 w-5 sm:h-11 sm:w-8" rounded="rounded-none" shadow={false} />
                          </span>
                        ))}
                      </span>
                    )
                  )}
                  {info?.pages > 0 && (
                    <span className="mt-auto self-end font-pixel text-[10px] text-cocoa-deep lg:hidden">{info.pages}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
