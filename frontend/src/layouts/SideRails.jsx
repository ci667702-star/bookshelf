import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, LibraryBig, Quote as QuoteIcon, Ruler, Target, Timer as TimerIcon, UserRound, Users } from 'lucide-react';
import Window from '../components/ui/Window.jsx';
import { Avatar, ProgressBar } from '../components/ui/Misc.jsx';
import ShelfScene from '../components/book/ShelfScene.jsx';
import MarathonTower from '../components/book/MarathonTower.jsx';
import MonthGrid from '../components/calendar/MonthGrid.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import BookCover from '../components/book/BookCover.jsx';
import { StartTimerButton, useTimer } from '../components/book/Timer.jsx';
import { FeedItem, useFeed } from '../components/social/Follow.jsx';
import { quoteApi, readingApi, shelfApi, userApi } from '../services/index.js';
import { num, progressPct } from '../utils/format.js';

// ───────── 왼쪽: 내 정보 · 내 책장 · 이번 달 · 책탑 ─────────

function MyInfo() {
  const { user } = useAuth();
  const profile = useQuery({ queryKey: ['users', user.id], queryFn: () => userApi.profile(user.id) }).data;
  const m = useQuery({ queryKey: ['marathon'], queryFn: readingApi.marathon }).data;
  return (
    <Window
      title="내 정보"
      tone="rose"
      icon={UserRound}
      bodyClassName="p-3"
      footer={
        <Link to="/me" className="text-link hover:underline">
          마이페이지 ›
        </Link>
      }
    >
      <div className="flex items-center gap-2.5">
        <Avatar user={user} size={46} />
        <div className="min-w-0">
          <p className="truncate font-pixel text-[14px] font-bold">{user.nickname}</p>
          {user.bio && <p className="line-clamp-2 text-[11.5px] leading-snug text-ink-soft">{user.bio}</p>}
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-1.5 text-center">
        {[
          ['완독', m ? `${m.finishedCount}권` : '–', 'bg-matcha'],
          ['쪽수', m ? num(m.totalPages) : '–', 'bg-butter'],
          ['높이', m ? `${m.heightCm}cm` : '–', 'bg-sky'],
        ].map(([k, v, tone]) => (
          <div key={k} className={`rounded-[5px] border border-ink/40 ${tone} px-1 py-1.5`}>
            <dt className="text-[10.5px] text-ink/70">{k}</dt>
            <dd className="truncate font-pixel text-[12.5px] font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      {profile && (
        <p className="mt-2.5 flex gap-3 text-[12px] text-ink-soft">
          <span>
            팔로워 <b className="text-ink">{profile.followerCount}</b>
          </span>
          <span>
            팔로잉 <b className="text-ink">{profile.followingCount}</b>
          </span>
          <span>
            독후감 <b className="text-ink">{profile.stats.reviews}</b>
          </span>
        </p>
      )}
    </Window>
  );
}

function MyShelvesMini() {
  const q = useQuery({ queryKey: ['shelves', 'mine'], queryFn: () => shelfApi.list({ scope: 'mine' }) });
  const shelves = q.data?.items ?? [];
  const first = shelves[0];
  return (
    <Window
      title="내 책장"
      tone="tangerine"
      icon={LibraryBig}
      bodyClassName="p-3"
      footer={
        <Link to="/shelves" className="text-link hover:underline">
          책장 전체 ›
        </Link>
      }
    >
      {!q.data ? (
        <p className="text-[12.5px] text-ink-soft">불러오는 중...</p>
      ) : (
        <>
          {first && (
            <Link to={`/shelves/${first.id}`} className="block" aria-label={`${first.name} 책장 열기`}>
              <ShelfScene
                compact
                minRows={1}
                linkBooks={false}
                records={(first.previewBooks ?? []).map((b) => ({ id: b.id, book: { ...b, author: b.author ?? '' } }))}
                decoration={{ theme: first.theme, layout: { shelfStyle: 'wood', arrangement: 'spine' }, decorations: [] }}
                emptyMessage={<span className="text-[11.5px]">빈 책장</span>}
              />
            </Link>
          )}
          <ul className="mt-2 flex flex-col">
            {shelves.slice(0, 4).map((s) => (
              <li key={s.id}>
                <Link to={`/shelves/${s.id}`} className="flex items-center justify-between rounded-[4px] px-1.5 py-1 text-[12.5px] hover:bg-milk">
                  <span className="truncate font-semibold">{s.name}</span>
                  <span className="shrink-0 font-pixel text-[11px] text-ink-soft">{s.bookCount}권</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Window>
  );
}

function MonthMini() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = now.getMonth() + 1;
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ['calendar', y, mo], queryFn: () => readingApi.calendar(y, mo) });
  return (
    <Window
      title={`${mo}월 독서 달력`}
      tone="rose"
      icon={CalendarDays}
      bodyClassName="p-2.5"
      footer={
        <Link to="/calendar" className="text-link hover:underline">
          달력 보기 ›
        </Link>
      }
    >
      {!q.data ? (
        <p className="text-[12.5px] text-ink-soft">불러오는 중...</p>
      ) : (
        <>
          <MonthGrid variant="mini" year={y} month={mo} days={q.data.days} today={q.data.today} onSelect={(k) => navigate(`/calendar?date=${k}`)} />
          <p className="mt-1 text-[11.5px] text-ink-soft">
            {q.data.stats.readingDays}일 · {num(q.data.stats.totalPages)}쪽 · 완독 {q.data.stats.finishedCount}권
          </p>
        </>
      )}
    </Window>
  );
}

function TowerMini() {
  const m = useQuery({ queryKey: ['marathon'], queryFn: readingApi.marathon }).data;
  return (
    <Window
      title="나의 책탑"
      tone="butter"
      icon={Ruler}
      bodyClassName="p-3 pt-6"
      footer={
        <Link to="/marathon" className="text-link hover:underline">
          마라톤 보기 ›
        </Link>
      }
    >
      {!m ? (
        <p className="text-[12.5px] text-ink-soft">불러오는 중...</p>
      ) : (
        <MarathonTower compact animate={false} stack={m.stack} totalPages={m.totalPages} heightCm={m.heightCm} maxHeight={130} />
      )}
    </Window>
  );
}

/** 넓은 화면 왼쪽 패널. 지금 보고 있는 화면과 같은 내용의 창은 숨긴다 */
export function LeftRail({ className = '' }) {
  const { pathname } = useLocation();
  const onHome = pathname === '/dashboard';
  return (
    <aside aria-label="내 기록 요약" className={className}>
      <div className="sticky top-[76px] flex max-h-[calc(100dvh-170px)] flex-col gap-4 overflow-y-auto pr-1 pb-2 scrollbar-none [&>*]:shrink-0">
        {pathname !== '/me' && <MyInfo />}
        {!pathname.startsWith('/shelves') && <MyShelvesMini />}
        {!onHome && pathname !== '/calendar' && <MonthMini />}
        {!onHome && pathname !== '/marathon' && <TowerMini />}
      </div>
    </aside>
  );
}

// ───────── 오른쪽: 작은 위젯 창들 ─────────

function ReadingNow() {
  const reading = useQuery({ queryKey: ['reading', 'READING'], queryFn: () => readingApi.list({ status: 'READING' }) });
  const timer = useTimer();
  const running = timer.data?.session?.record?.id;
  const items = reading.data?.items ?? [];
  return (
    <Window title="지금 읽는 책" tone="lime" icon={TimerIcon} bodyClassName="p-3">
      {!reading.data ? (
        <p className="text-[12.5px] text-ink-soft">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="text-[12.5px] text-ink-soft">
          읽는 중인 책이 없어요.{' '}
          <Link to="/books/new" className="text-link underline">
            책 등록
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.slice(0, 3).map((r) => (
            <li key={r.id} className="flex items-center gap-2.5">
              <Link to={`/books/${r.book.id}`} className="shrink-0">
                <BookCover book={r.book} className="h-12 w-[34px]" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/books/${r.book.id}`} className="block truncate font-pixel text-[12.5px] font-bold hover:underline">
                  {r.book.title}
                </Link>
                <div className="mt-1 flex items-center gap-1.5">
                  <ProgressBar value={progressPct(r)} tone="bg-cocoa" label={`${r.book.title} 진행률`} className="h-2" />
                  <span className="shrink-0 font-pixel text-[10px] text-ink-soft">{progressPct(r)}%</span>
                </div>
              </div>
              {running === r.id ? (
                <span className="shrink-0 rounded-[4px] bg-pin px-1.5 py-0.5 font-pixel text-[10px] text-white">진행 중</span>
              ) : (
                <StartTimerButton record={r} size="xs" variant="soft" label="" />
              )}
            </li>
          ))}
        </ul>
      )}
    </Window>
  );
}

function Goals() {
  const m = useQuery({ queryKey: ['marathon'], queryFn: readingApi.marathon }).data;
  return (
    <Window
      title="독서 목표"
      tone="butter"
      icon={Target}
      bodyClassName="flex flex-col gap-3 p-3"
      footer={
        <Link to="/marathon" className="text-link hover:underline">
          마라톤 보기 ›
        </Link>
      }
    >
      {!m ? (
        <p className="text-[12.5px] text-ink-soft">불러오는 중...</p>
      ) : (
        <>
          <div>
            <div className="mb-1 flex justify-between text-[12px]">
              <span className="font-semibold">
                올해 {m.yearFinished} / {m.goals.yearlyGoalBooks}권
              </span>
              <span className="text-ink-soft">{m.goals.yearlyRate}%</span>
            </div>
            <ProgressBar value={m.goals.yearlyRate} tone="bg-matcha-deep" label="올해 완독 목표 달성률" className="h-2" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[12px]">
              <span className="font-semibold">
                {m.month}월 {num(m.monthPages)} / {num(m.goals.monthlyGoalPages)}쪽
              </span>
              <span className="text-ink-soft">{m.goals.monthlyRate}%</span>
            </div>
            <ProgressBar value={m.goals.monthlyRate} tone="bg-pin" label="이번 달 페이지 목표 달성률" className="h-2" />
          </div>
          <p className="flex items-baseline gap-1 text-[12px] text-ink-soft">
            지금 책탑 <b className="numeral text-[18px] text-ink">{m.heightCm}</b>cm
          </p>
        </>
      )}
    </Window>
  );
}

function FriendNews() {
  const feed = useFeed();
  const items = feed.data?.items ?? [];
  return (
    <Window
      title="친구 소식"
      tone="aqua"
      icon={Users}
      bodyClassName="px-3 py-1"
      footer={
        <Link to="/explore?tab=feed" className="text-link hover:underline">
          더 보기 ›
        </Link>
      }
    >
      {!feed.data ? (
        <p className="py-2 text-[12.5px] text-ink-soft">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="py-2 text-[12.5px] text-ink-soft">
          {feed.data.followingCount ? '새 소식이 아직 없어요.' : '다른 독자를 팔로우하면 소식이 떠요.'}
        </p>
      ) : (
        <ul className="divide-y divide-ink/10">
          {items.slice(0, 3).map((item) => (
            <FeedItem key={item.id} item={item} compact />
          ))}
        </ul>
      )}
    </Window>
  );
}

/** 내가 모은 문장 중 하나를 날마다 바꿔 보여 준다 */
function TodayQuote() {
  const q = useQuery({ queryKey: ['quotes', 'mine', 'rail'], queryFn: () => quoteApi.list({ scope: 'mine', limit: 30 }) });
  const items = q.data?.items ?? [];
  const dayIndex = Math.floor(Date.now() / 86400000);
  const pick = items.length ? items[dayIndex % items.length] : null;
  return (
    <Window title="오늘의 문장" tone="rose" icon={QuoteIcon} bodyClassName="p-3">
      {!q.data ? (
        <p className="text-[12.5px] text-ink-soft">불러오는 중...</p>
      ) : !pick ? (
        <p className="text-[12.5px] text-ink-soft">책 화면의 「문장 모으기」로 마음에 남은 문장을 모아 보세요. 여기에 하루 하나씩 떠요.</p>
      ) : (
        <figure>
          <blockquote className="hand text-[18px] leading-snug">“{pick.content}”</blockquote>
          <figcaption className="mt-1.5 text-[11.5px] text-ink-soft">
            <Link to={`/books/${pick.book.id}`} className="font-pixel hover:underline">
              「{pick.book.title}」
            </Link>
            {pick.page ? ` ${pick.page}쪽` : ''}
          </figcaption>
        </figure>
      )}
    </Window>
  );
}

/** 넓은 화면 오른쪽 패널. 홈에서는 본문과 겹치는 창(읽는 책 · 친구 소식)은 뺀다 */
export function RightRail({ className = '' }) {
  const { pathname } = useLocation();
  const onHome = pathname === '/dashboard';
  return (
    <aside aria-label="바로 보기" className={className}>
      <div className="sticky top-[76px] flex max-h-[calc(100dvh-170px)] flex-col gap-4 overflow-y-auto pr-1 pb-2 scrollbar-none [&>*]:shrink-0">
        {!onHome && <ReadingNow />}
        <Goals />
        <TodayQuote />
        {!onHome && <FriendNews />}
      </div>
    </aside>
  );
}
