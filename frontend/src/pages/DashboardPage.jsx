import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookPlus, CalendarDays, Compass, LibraryBig, NotebookPen, PenLine, Ruler, Users } from 'lucide-react';
import { miscApi } from '../services/index.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import Button from '../components/ui/Button.jsx';
import Window from '../components/ui/Window.jsx';
import { QueryState, SkeletonBlock } from '../components/ui/States.jsx';
import { ProgressBar, StatTile } from '../components/ui/Misc.jsx';
import BookCover from '../components/book/BookCover.jsx';
import ShelfScene from '../components/book/ShelfScene.jsx';
import MarathonTower from '../components/book/MarathonTower.jsx';
import MonthGrid from '../components/calendar/MonthGrid.jsx';
import LogModal from '../components/book/LogModal.jsx';
import { formatTodayLong, num, progressPct } from '../utils/format.js';
import { FeedItem, useFeed } from '../components/social/Follow.jsx';
import { StartTimerButton, useTimer } from '../components/book/Timer.jsx';

/** 홈 화면의 작은 위젯 창: 요약만 보여 주고 자세한 건 해당 화면으로 */
function Widget({ title, tone, icon, to, linkLabel = '열기', children }) {
  return (
    <Window
      title={title}
      tone={tone}
      icon={icon}
      bodyClassName="p-3"
      footer={
        <Link to={to} className="text-[12px] text-link hover:underline">
          {linkLabel} ›
        </Link>
      }
    >
      {children}
    </Window>
  );
}

export default function DashboardPage() {
  useDocumentTitle('홈');
  const { user } = useAuth();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ['dashboard'], queryFn: miscApi.dashboard });
  const [logRecord, setLogRecord] = useState(null);
  const feed = useFeed();
  const timer = useTimer();

  return (
    <QueryState query={q} loading={<SkeletonBlock className="h-96" />}>
      {(d) => {
        const firstShelf = d.shelves[0];
        return (
          <div className="flex flex-col gap-6">
            {/* 환영 */}
            <section className="flex overflow-hidden rounded-[3px] border-[1.5px] border-ink bg-rose-deep">
              <div className="engraved flex min-w-0 flex-1 flex-wrap items-end justify-between gap-4 px-4 py-5 sm:px-6 sm:py-6">
              <div className="min-w-0">
                <p className="font-serif text-[13px] font-semibold text-ink/75">{formatTodayLong()}</p>
                <h1 className="mt-1.5 text-[24px] leading-[1.2] tracking-[-0.045em] sm:text-[30px]">
                  {user?.nickname}님,
                  <br />
                  오늘도 한 페이지 읽어볼까요?
                </h1>
              </div>
              <div className="flex gap-2">
                <Button to="/books/new" size="sm">
                  <BookPlus size={15} /> 책 등록
                </Button>
                <Button to="/reviews/new" size="sm" variant="outline">
                  <PenLine size={14} /> 독후감
                </Button>
              </div>
              </div>
              <div className="page-block w-3 shrink-0 border-l-[1.5px] border-ink bg-milk sm:w-4" aria-hidden />
            </section>

            {/* 통계 */}
            <section aria-label="나의 독서 통계" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <StatTile tone="bg-matcha" label="완독한 책" value={num(d.stats.finishedCount)} unit="권" />
              <StatTile tone="bg-butter" label="누적 페이지" value={num(d.stats.totalPages)} unit="쪽" />
              <StatTile tone="bg-sky" label="독서 높이" value={d.stats.heightCm} unit="cm" />
              <StatTile tone="bg-lilac" label="이번 달" value={num(d.stats.monthPages)} unit="쪽" />
            </section>

            {/* 지금 읽는 책 */}
            <section>
              <h2 className="mb-2.5 text-[16px]">지금 읽는 책</h2>
              {d.currentlyReading.length === 0 ? (
                <p className="rounded-[3px] border-[1.5px] border-dashed border-ink/30 px-4 py-5 text-center text-[13.5px] text-ink-soft">
                  읽는 중인 책이 없어요.{' '}
                  <Link to="/books/new" className="font-semibold text-link underline">
                    책 등록하기
                  </Link>
                </p>
              ) : (
                <ul className="grid gap-2.5 md:grid-cols-2">
                  {d.currentlyReading.map((r) => (
                    <li key={r.id} className="card flex items-center gap-3 p-2.5">
                      <Link to={`/books/${r.book.id}`} className="shrink-0">
                        <BookCover book={r.book} className="h-14 w-10" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to={`/books/${r.book.id}`} className="block truncate text-[13.5px] font-bold hover:underline">
                          {r.book.title}
                        </Link>
                        <div className="mt-1.5 flex items-center gap-2">
                          <ProgressBar value={progressPct(r)} label={`${r.book.title} 진행률`} />
                          <span className="shrink-0 text-[11px] text-ink-soft">
                            {r.currentPage}/{r.book.totalPages}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                        {timer.data?.session?.record?.id !== r.id && <StartTimerButton record={r} size="xs" variant="green" label="타이머" />}
                        <Button size="xs" variant="secondary" onClick={() => setLogRecord(r)}>
                          기록
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* 위젯 */}
            <section aria-label="바로 가기" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Widget title="독서 마라톤" tone="butter" icon={Ruler} to="/marathon" linkLabel="마라톤 보기">
                <div className="pt-4">
                  <MarathonTower compact animate={false} stack={d.marathon.stack} totalPages={d.marathon.totalPages} heightCm={d.marathon.heightCm} maxHeight={120} />
                </div>
              </Widget>

              <Widget title={`${d.calendar.month}월 달력`} tone="rose" icon={CalendarDays} to="/calendar" linkLabel="달력 보기">
                <MonthGrid
                  variant="mini"
                  year={d.calendar.year}
                  month={d.calendar.month}
                  days={d.calendar.days}
                  today={d.calendar.today}
                  onSelect={(key) => navigate(`/calendar?date=${key}`)}
                />
                <p className="mt-1.5 text-[12px] text-ink-soft">
                  {d.calendar.stats.readingDays}일 동안 {num(d.calendar.stats.totalPages)}쪽 · 완독 {d.calendar.stats.finishedCount}권
                </p>
              </Widget>

              <Widget title={firstShelf ? firstShelf.name : '나의 책장'} tone="tangerine" icon={LibraryBig} to={firstShelf ? `/shelves/${firstShelf.id}` : '/shelves'} linkLabel="책장 열기">
                <ShelfScene
                  compact
                  minRows={1}
                  records={(firstShelf?.previewBooks ?? []).map((b) => ({ id: b.id, book: b }))}
                  decoration={{ theme: firstShelf?.theme ?? 'cream', layout: { shelfStyle: 'wood', arrangement: 'spine' }, decorations: [] }}
                  emptyMessage={<span className="text-[12.5px]">아직 빈 책장이에요</span>}
                />
              </Widget>

              <Widget title="공유 책장" tone="green" icon={Users} to="/shared" linkLabel="공유 책장 보기">
                {d.sharedShelves.length === 0 ? (
                  <p className="py-3 text-[13px] text-ink-soft">친구와 함께 쓰는 책장이 아직 없어요.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {d.sharedShelves.slice(0, 3).map((s) => (
                      <li key={s.id}>
                        <Link to={`/shared/${s.id}`} className="flex items-center justify-between rounded-[3px] px-2 py-1.5 text-[13px] hover:bg-milk">
                          <span className="truncate font-semibold">{s.name}</span>
                          <span className="shrink-0 text-[11.5px] text-ink-soft">
                            {s.memberCount}명 · {s.bookCount}권
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Widget>

              <Widget title="최근 독후감" tone="butter" icon={NotebookPen} to="/reviews?tab=mine" linkLabel="내 독후감">
                {d.recentReviews.length === 0 ? (
                  <p className="py-3 text-[13px] text-ink-soft">아직 쓴 독후감이 없어요.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {d.recentReviews.map((r) => (
                      <li key={r.id}>
                        <Link to={`/reviews/${r.id}`} className="block rounded-[3px] px-2 py-1.5 hover:bg-milk">
                          <span className="block truncate text-[13px] font-semibold">{r.title}</span>
                          <span className="block truncate text-[11.5px] text-ink-soft">{r.book?.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Widget>

              <Widget title="친구 소식" tone="aqua" icon={Compass} to="/explore?tab=feed" linkLabel="친구 소식 · 둘러보기">
                {!feed.data ? (
                  <p className="py-3 text-[13px] text-ink-soft">불러오는 중...</p>
                ) : feed.data.items.length === 0 ? (
                  <p className="py-3 text-[13px] text-ink-soft">
                    {feed.data.followingCount ? '친구들의 새 소식이 아직 없어요.' : '다른 독자를 팔로우하면 여기에 소식이 떠요.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-ink/10">
                    {feed.data.items.slice(0, 3).map((item) => (
                      <FeedItem key={item.id} item={item} compact />
                    ))}
                  </ul>
                )}
              </Widget>
            </section>

            {/* 최근 등록한 책 */}
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[16px]">최근 등록한 책</h2>
                <Link to="/shelves" className="text-[12px] text-link hover:underline">
                  전체 ›
                </Link>
              </div>
              {d.recentBooks.length === 0 ? (
                <p className="text-[13.5px] text-ink-soft">아직 등록한 책이 없어요.</p>
              ) : (
                <div className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                  {d.recentBooks.map((r) => (
                    <Link key={r.id} to={`/books/${r.book.id}`} className="group w-[88px] shrink-0">
                      <BookCover book={r.book} className="aspect-[3/4] w-full transition-transform group-hover:-translate-y-1" />
                      <p className="mt-1.5 truncate font-serif text-[12px] font-bold">{r.book.title}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <LogModal open={!!logRecord} record={logRecord} onClose={() => setLogRecord(null)} />
          </div>
        );
      }}
    </QueryState>
  );
}
