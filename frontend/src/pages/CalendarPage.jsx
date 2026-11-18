import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ImageDown, Plus } from 'lucide-react';
import { readingApi } from '../services/index.js';
import { useDocumentTitle } from '../hooks/index.js';
import Button from '../components/ui/Button.jsx';
import { QueryState, SkeletonBlock } from '../components/ui/States.jsx';
import { ProgressBar } from '../components/ui/Misc.jsx';
import Sticker from '../components/ui/Sticker.jsx';
import BookCover from '../components/book/BookCover.jsx';
import LogModal from '../components/book/LogModal.jsx';
import MonthGrid from '../components/calendar/MonthGrid.jsx';
import { MonthShareCard, ShareImageModal } from '../components/share/ShareImage.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { formatDay, num, todayKey } from '../utils/format.js';

function Stat({ label, value, unit, tone }) {
  return (
    <div className={`rounded-[8px] ${tone} px-4 py-3`}>
      <p className="text-[12px] font-semibold text-ink/70">{label}</p>
      <p className="flex items-baseline gap-0.5">
        <span className="numeral text-[24px] leading-tight">{value}</span>
        <span className="text-[12px] font-bold">{unit}</span>
      </p>
    </div>
  );
}

export default function CalendarPage() {
  useDocumentTitle('독서 달력');
  const [params, setParams] = useSearchParams();
  const initial = params.get('date') || todayKey();
  const [ym, setYm] = useState(() => {
    const [y, m] = initial.split('-').map(Number);
    return { year: y, month: m };
  });
  const [selected, setSelected] = useState(initial);
  const [logOpen, setLogOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { user } = useAuth();

  const q = useQuery({
    queryKey: ['calendar', ym.year, ym.month],
    queryFn: () => readingApi.calendar(ym.year, ym.month),
    placeholderData: keepPreviousData,
  });
  const loggable = useQuery({ queryKey: ['reading', 'loggable'], queryFn: () => readingApi.list() });
  const loggableRecords = useMemo(
    () => (loggable.data?.items ?? []).filter((r) => r.status !== 'FINISHED'),
    [loggable.data]
  );

  const move = (delta) => {
    setYm(({ year, month }) => {
      const d = new Date(year, month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  };
  const select = (key) => {
    setSelected(key);
    setParams({ date: key }, { replace: true });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px]">독서 달력</h1>
          <p className="mt-1 text-[14px] text-ink-soft">책을 읽은 날엔 표지가, 완독한 날엔 빨간 핀이 꽂혀요.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="soft" onClick={() => setSharing(true)} disabled={!q.data}>
            <ImageDown size={16} /> 이달 결산 이미지
          </Button>
          <Button onClick={() => setLogOpen(true)}>
            <Plus size={16} /> 독서 기록 추가
          </Button>
        </div>
      </div>
      {q.data && (
        <ShareImageModal open={sharing} onClose={() => setSharing(false)} title={`${q.data.month}월 독서 결산`} filename={`bookmoment-${q.data.year}-${q.data.month}`}>
          <MonthShareCard data={q.data} nickname={user?.nickname} />
        </ShareImageModal>
      )}

      <QueryState query={q} loading={<SkeletonBlock className="h-[640px]" />}>
        {(data) => {
          const day = data.days[selected];
          const inMonth = selected?.startsWith(`${data.year}-${String(data.month).padStart(2, '0')}`);
          return (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              {/* 크라프트지 위 다이어리 달력 */}
              <section className="kraft-paper rounded-[8px] p-3 sm:p-6" aria-label={`${data.year}년 ${data.month}월 달력`}>
                <div className={`relative rounded-[8px] bg-paper p-3 shadow-[0_18px_30px_-18px_rgba(81,68,61,0.6)] sm:p-6 ${q.isPlaceholderData ? 'opacity-60' : ''}`}>
                  <Sticker type="ribbon" className="absolute -top-5 -right-3 h-14 w-14 rotate-12" />
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-3">
                      <h2 className="font-serif text-[34px] leading-none sm:text-[42px]">{data.month}월</h2>
                      <span className="numeral text-[20px] text-ink-soft">{data.year}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => move(-1)} aria-label="이전 달" className="grid h-10 w-10 place-items-center rounded-full bg-milk transition hover:bg-kraft">
                        <ChevronLeft size={19} />
                      </button>
                      <button
                        onClick={() => {
                          const t = todayKey();
                          const [y, m] = t.split('-').map(Number);
                          setYm({ year: y, month: m });
                          select(t);
                        }}
                        className="h-10 rounded-full bg-milk px-3.5 text-[13px] font-semibold transition hover:bg-kraft"
                      >
                        오늘
                      </button>
                      <button onClick={() => move(1)} aria-label="다음 달" className="grid h-10 w-10 place-items-center rounded-full bg-milk transition hover:bg-kraft">
                        <ChevronRight size={19} />
                      </button>
                    </div>
                  </div>
                  <MonthGrid year={data.year} month={data.month} days={data.days} today={data.today} selected={selected} onSelect={select} />
                </div>

                {/* 월간 통계 */}
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  <Stat label="읽은 페이지" value={num(data.stats.totalPages)} unit="쪽" tone="bg-paper/90" />
                  <Stat label="쌓인 높이" value={data.stats.heightCm} unit="cm" tone="bg-paper/90" />
                  <Stat label="읽은 날" value={data.stats.readingDays} unit="일" tone="bg-paper/90" />
                  <Stat label="완독" value={data.stats.finishedCount} unit="권" tone="bg-paper/90" />
                  <Stat label="최장 연속" value={data.stats.bestStreak} unit="일" tone="bg-paper/90" />
                  <Stat label="읽은 시간" value={data.stats.totalMinutes ?? 0} unit="분" tone="bg-paper/90" />
                </div>
                <div className="mt-2 rounded-[8px] bg-paper/90 px-4 py-3">
                  <div className="mb-1.5 flex justify-between text-[12.5px]">
                    <span className="font-semibold">이번 달 목표 {num(data.stats.monthlyGoalPages)}쪽</span>
                    <span className="text-ink-soft">{data.stats.goalRate}%</span>
                  </div>
                  <ProgressBar value={data.stats.goalRate} tone="bg-pin" label="월간 독서 목표 달성률" />
                </div>
              </section>

              {/* 선택한 날짜 */}
              <aside className="card self-start p-5 xl:sticky xl:top-24" aria-live="polite">
                <p className="text-[12.5px] font-semibold text-ink-soft">선택한 날</p>
                <h2 className="text-[22px]">{selected ? formatDay(selected, { withYear: true }) : '날짜를 골라 주세요'}</h2>
                {!inMonth ? (
                  <p className="mt-4 text-[13.5px] text-ink-soft">달력에서 날짜를 눌러 그날의 독서를 확인해 보세요.</p>
                ) : !day ? (
                  <div className="mt-4 rounded-[8px] bg-milk px-4 py-6 text-center">
                    <p className="text-[13.5px] text-ink-soft">이날은 독서 기록이 없어요.</p>
                    {selected <= todayKey() && (
                      <Button size="sm" variant="secondary" className="mt-3" onClick={() => setLogOpen(true)}>
                        이날 기록 추가
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-[14px]">
                      <b className="numeral text-[22px] text-cocoa-deep">{day.pages}</b>쪽 읽었어요
                      {day.minutes > 0 && <span className="ml-1 text-ink-soft">({day.minutes}분)</span>}
                    </p>
                    {day.finished.length > 0 && (
                      <div className="mt-4 rounded-[8px] bg-rose/60 p-3">
                        <p className="mb-2 flex items-center gap-1.5 text-[13px] font-bold">
                          <span className="h-3 w-3 rounded-full border-[1.5px] border-[#8f2e29] bg-pin" aria-hidden /> 완독한 책
                        </p>
                        {day.finished.map((f) => (
                          <Link key={f.recordId} to={`/books/${f.book.id}`} className="flex items-center gap-2.5 rounded-xl p-1 hover:bg-paper/60">
                            <BookCover book={f.book} className="h-12 w-9 shrink-0" />
                            <span className="truncate font-serif text-[14px] font-bold">{f.book.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    <ul className="mt-4 flex flex-col gap-2">
                      {day.logs.map((l) => (
                        <li key={l.id}>
                          <Link to={`/books/${l.book.id}`} className="flex gap-3 rounded-[8px] bg-milk p-2.5 transition hover:bg-kraft/60">
                            <BookCover book={l.book} className="h-14 w-10 shrink-0" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-serif text-[14px] font-bold">{l.book.title}</span>
                              <span className="block text-[12.5px] text-ink-soft">
                                {l.pagesRead}쪽{l.minutes ? ` · ${l.minutes}분` : ''}{l.isAuto ? ' (진행 업데이트)' : ''}
                              </span>
                              {l.memo && <span className="mt-0.5 block text-[12.5px]">“{l.memo}”</span>}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {selected <= todayKey() && (
                      <Button size="sm" variant="ghost" className="mt-3 w-full" onClick={() => setLogOpen(true)}>
                        <Plus size={14} /> 이날 기록 더하기
                      </Button>
                    )}
                  </>
                )}
              </aside>
            </div>
          );
        }}
      </QueryState>

      <LogModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        records={loggableRecords}
        defaultDate={selected && selected <= todayKey() ? selected : todayKey()}
      />
    </div>
  );
}
