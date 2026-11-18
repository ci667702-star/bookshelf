import { Suspense, useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bell,
  BookPlus,
  CalendarDays,
  Compass,
  House,
  LibraryBig,
  LogOut,
  NotebookPen,
  Palette,
  Ruler,
  Search,
  Settings,
  Smartphone,
  UserRound,
  Users,
} from 'lucide-react';
import { LogoMark } from '../components/ui/Logo.jsx';
import { Avatar } from '../components/ui/Misc.jsx';
import { PageLoader, Spinner } from '../components/ui/States.jsx';
import Window from '../components/ui/Window.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { miscApi } from '../services/index.js';
import { useDismiss, useMediaQuery } from '../hooks/index.js';
import { LeftRail, RightRail } from './SideRails.jsx';
import { timeAgo } from '../utils/format.js';
import { TimerBar } from '../components/book/Timer.jsx';
import { BadgeWatcher } from '../components/social/Badges.jsx';
import { useInstallPrompt } from '../hooks/useInstallPrompt.js';

/** 화면별 창 제목 · 색 · 아이콘. top: 하단 탭의 최상위 화면(뒤로 가기 없음) */
const SCREENS = [
  { path: '/dashboard', title: '홈', tone: 'lime', icon: House, top: true },
  { path: '/shelves', title: '나의 책장', tone: 'tangerine', icon: LibraryBig, top: true },
  { path: '/shelves/:id', title: '책장', tone: 'tangerine', icon: LibraryBig },
  { path: '/books/new', title: '책 등록', tone: 'aqua', icon: BookPlus },
  { path: '/books/:id/edit', title: '책 정보 수정', tone: 'aqua', icon: BookPlus },
  { path: '/books/:id', title: '책 정보', tone: 'aqua', icon: BookPlus },
  { path: '/calendar', title: '독서 달력', tone: 'rose', icon: CalendarDays, top: true },
  { path: '/reviews', title: '독후감', tone: 'butter', icon: NotebookPen, top: true },
  { path: '/reviews/new', title: '독후감 쓰기', tone: 'butter', icon: NotebookPen },
  { path: '/reviews/:id/edit', title: '독후감 수정', tone: 'butter', icon: NotebookPen },
  { path: '/reviews/:id', title: '독후감', tone: 'butter', icon: NotebookPen },
  { path: '/shared', title: '공유 책장', tone: 'green', icon: Users, top: true },
  { path: '/shared/:id', title: '공유 책장', tone: 'green', icon: Users },
  { path: '/marathon', title: '독서 마라톤', tone: 'butter', icon: Ruler },
  { path: '/explore', title: '둘러보기', tone: 'aqua', icon: Compass },
  { path: '/decorate', title: '책장 꾸미기', tone: 'lilac', icon: Palette },
  { path: '/decorate/:id', title: '책장 꾸미기', tone: 'lilac', icon: Palette },
  { path: '/search', title: '검색', tone: 'sky', icon: Search },
  { path: '/me', title: '마이페이지', tone: 'rose', icon: UserRound },
  { path: '/settings', title: '설정', tone: 'kraft', icon: Settings },
  { path: '/users/:id', title: '프로필', tone: 'rose', icon: UserRound },
];

function useScreen() {
  const { pathname } = useLocation();
  return SCREENS.find((s) => matchPath({ path: s.path, end: true }, pathname)) ?? { title: '북모먼트', tone: 'kraft', icon: House };
}

const TABS = [
  { to: '/dashboard', label: '홈', icon: House },
  { to: '/shelves', label: '책장', icon: LibraryBig },
  { to: '/books/new', label: '등록', icon: BookPlus, primary: true },
  { to: '/calendar', label: '달력', icon: CalendarDays },
  { to: '/reviews', label: '독후감', icon: NotebookPen },
];

const START_ITEMS = [
  { to: '/shared', label: '공유 책장', icon: Users },
  { to: '/marathon', label: '독서 마라톤', icon: Ruler },
  { to: '/explore', label: '둘러보기', icon: Compass },
  { to: '/decorate', label: '책장 꾸미기', icon: Palette },
  { to: '/search', label: '검색', icon: Search },
  { to: '/me', label: '마이페이지', icon: UserRound },
  { to: '/settings', label: '설정', icon: Settings },
];

const NOTI_TEXT = {
  LIKE: (n) => `「${n.review?.title ?? '독후감'}」에 좋아요를 눌렀어요.`,
  COMMENT: (n) => `「${n.review?.title ?? '독후감'}」에 댓글을 남겼어요.`,
  JOIN: (n) => `공유 책장 「${n.sharedBookshelf?.name ?? ''}」에 참여했어요.`,
  FOLLOW: () => '나를 팔로우했어요.',
};

const popupCls =
  'absolute z-50 animate-pop overflow-hidden rounded-[6px] border-[1.5px] border-ink/85 bg-paper shadow-[4px_4px_0_rgba(81,68,61,0.85)]';

function Notifications() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);
  const qc = useQueryClient();
  const { user } = useAuth();
  const q = useQuery({ queryKey: ['notifications'], queryFn: miscApi.notifications, enabled: open, staleTime: 0 });
  const read = useMutation({
    mutationFn: miscApi.readNotifications,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
  const unread = user?.unreadNotifications ?? 0;

  useEffect(() => {
    if (open && unread > 0) read.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`알림${unread ? ` ${unread}개 안 읽음` : ''}`}
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-[5px] border-[1.5px] border-ink/85 bg-paper bevel transition hover:bg-milk"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-[1.5px] border-paper bg-pin px-1 font-pixel text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className={`${popupCls} top-11 right-0 w-[min(340px,calc(100vw-24px))]`}>
          <div className="flex h-9 items-center border-b-[1.5px] border-ink/85 bg-butter px-3 font-pixel text-[13px] font-bold">알림</div>
          <div className="max-h-[360px] overflow-y-auto">
            {q.isPending ? (
              <div className="grid place-items-center py-8">
                <Spinner />
              </div>
            ) : q.isError ? (
              <p className="p-4 text-[13px] text-berry">{q.error.message}</p>
            ) : q.data.items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-ink-soft">새 알림이 없어요.</p>
            ) : (
              <ul>
                {q.data.items.map((n) => (
                  <li key={n.id}>
                    <Link
                      to={
                        n.review
                          ? `/reviews/${n.review.id}`
                          : n.sharedBookshelf
                            ? `/shared/${n.sharedBookshelf.id}`
                            : n.type === 'FOLLOW'
                              ? `/users/${n.actor.id}`
                              : '/dashboard'
                      }
                      onClick={close}
                      className={`flex gap-3 border-b border-ink/10 px-3 py-2.5 transition hover:bg-milk ${n.isRead ? '' : 'bg-rose/30'}`}
                    >
                      <Avatar user={n.actor} size={30} />
                      <span className="min-w-0 flex-1 text-[13px] leading-snug">
                        <b>{n.actor.nickname}</b>님이 {NOTI_TEXT[n.type]?.(n)}
                        <span className="mt-0.5 block text-[11.5px] text-ink-soft">{timeAgo(n.createdAt)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);
  const navigate = useNavigate();
  const toast = useToast();
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-label="내 메뉴" aria-expanded={open} className="block rounded-full">
        <Avatar user={user} size={36} />
      </button>
      {open && (
        <div className={`${popupCls} top-11 right-0 w-48 py-1`}>
          <p className="truncate px-3 pt-1 pb-2 font-pixel text-[13px] font-bold">{user?.nickname}</p>
          <Link to="/me" onClick={close} className="flex items-center gap-2 px-3 py-2 text-[13.5px] hover:bg-link hover:text-white">
            <UserRound size={15} /> 마이페이지
          </Link>
          <Link to="/settings" onClick={close} className="flex items-center gap-2 px-3 py-2 text-[13.5px] hover:bg-link hover:text-white">
            <Settings size={15} /> 설정
          </Link>
          <button
            onClick={async () => {
              close();
              await logout();
              toast.success('로그아웃했어요.');
              navigate('/');
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13.5px] text-berry hover:bg-rose/50"
          >
            <LogOut size={15} /> 로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

/** 상단 앱 바: 로고 · 검색 · 알림 · 프로필 */
function AppBar() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  return (
    <header className="sticky top-0 z-30 border-b-[1.5px] border-ink/85 bg-chrome bevel">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-3 sm:px-4 xl:max-w-[1260px] 2xl:max-w-[1760px]">
        <Link to="/dashboard" className="flex shrink-0 items-center gap-2" aria-label="북모먼트 홈">
          <LogoMark className="h-8 w-8" />
          <span className="wordmark hidden text-[17px] text-cocoa-deep sm:inline">북모먼트</span>
        </Link>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
          }}
          className="relative ml-auto hidden max-w-sm flex-1 md:block"
        >
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft" />
          <label htmlFor="global-search" className="sr-only">
            검색
          </label>
          <input
            id="global-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="책, 작가, 닉네임, 책장, 독후감"
            className="field h-9 pl-9 text-[13.5px]"
          />
        </form>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            to="/search"
            aria-label="검색"
            className="grid h-9 w-9 place-items-center rounded-[5px] border-[1.5px] border-ink/85 bg-paper bevel md:hidden"
          >
            <Search size={17} />
          </Link>
          <Notifications />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(t);
  }, []);
  const h = now.getHours();
  return (
    <time dateTime={now.toISOString()} className="hidden rounded-[4px] px-2 py-1 font-pixel text-[12px] bevel-in sm:block">
      {h < 12 ? '오전' : '오후'} {String(h % 12 || 12).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
    </time>
  );
}

/** 하단 탭 바 (레트로 작업 표시줄 모양) + 시작 메뉴 */
function InstallHelp({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="북모먼트를 앱으로 설치하기" tone="aqua" size="sm">
      <ul className="flex flex-col gap-3 text-[14px] leading-relaxed">
        <li>
          <b className="font-pixel">아이폰 · 아이패드 (Safari)</b>
          <br />
          아래쪽 <b>공유</b> 버튼 → <b>홈 화면에 추가</b>
        </li>
        <li>
          <b className="font-pixel">안드로이드 (Chrome)</b>
          <br />
          오른쪽 위 <b>⋮</b> → <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>
        </li>
        <li>
          <b className="font-pixel">컴퓨터 (Chrome · Edge)</b>
          <br />
          주소창 오른쪽의 <b>설치</b> 아이콘
        </li>
      </ul>
      <p className="mt-4 text-[12.5px] text-ink-soft">설치하면 홈 화면 아이콘으로 바로 열리고, 주소창 없이 앱처럼 보여요.</p>
    </Modal>
  );
}

function TabBar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);
  const navigate = useNavigate();
  const pwa = useInstallPrompt();

  return (
    <>
    <InstallHelp open={installHelp} onClose={() => setInstallHelp(false)} />
    <nav
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 border-t-[1.5px] border-ink/85 bg-chrome bevel pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-1 px-2 sm:gap-2 sm:px-4">
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            className={`flex h-11 items-center gap-1.5 rounded-[5px] border-[1.5px] border-ink/85 bg-chrome px-2.5 font-pixel text-[13px] font-bold ${open ? 'bevel-in' : 'bevel'}`}
          >
            <LogoMark className="h-6 w-6" /> 시작
          </button>
          {open && (
            <div role="menu" className={`${popupCls} bottom-[52px] left-0 flex w-64`}>
              <div className="flex w-8 items-end justify-center bg-cocoa-deep py-3" aria-hidden>
                <span className="rotate-180 font-pixel text-[13px] font-bold whitespace-nowrap text-milk [writing-mode:vertical-rl]">BookMoment</span>
              </div>
              <div className="flex-1 py-1">
                <div className="flex items-center gap-2 border-b border-ink/15 px-3 py-2">
                  <Avatar user={user} size={28} />
                  <span className="truncate font-pixel text-[12.5px] font-bold">{user?.nickname}</span>
                </div>
                {START_ITEMS.map((i) => (
                  <Link
                    key={i.to}
                    role="menuitem"
                    to={i.to}
                    onClick={close}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13.5px] hover:bg-link hover:text-white"
                  >
                    <i.icon size={16} /> {i.label}
                  </Link>
                ))}
                {!pwa.installed && (
                  <button
                    role="menuitem"
                    onClick={async () => {
                      close();
                      if (pwa.canPrompt) await pwa.install();
                      else setInstallHelp(true);
                    }}
                    className="flex w-full items-center gap-2.5 border-t border-ink/15 px-3 py-2 text-left text-[13.5px] hover:bg-link hover:text-white"
                  >
                    <Smartphone size={16} /> 앱으로 설치
                  </button>
                )}
                <button
                  role="menuitem"
                  onClick={async () => {
                    close();
                    await logout();
                    navigate('/');
                  }}
                  className="flex w-full items-center gap-2.5 border-t border-ink/15 px-3 py-2 text-left text-[13.5px] text-berry hover:bg-rose/50"
                >
                  <LogOut size={16} /> 로그아웃
                </button>
              </div>
            </div>
          )}
        </div>

        <span className="mx-0.5 h-8 w-px bg-chrome-dark" aria-hidden />

        <div className="flex flex-1 items-center justify-around gap-1 sm:justify-center sm:gap-2">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/books/new'}
              className={({ isActive }) =>
                `flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[5px] font-pixel text-[11px] sm:max-w-[104px] sm:flex-row sm:gap-1.5 sm:text-[12.5px] ${
                  t.primary
                    ? 'border-[1.5px] border-ink/85 bg-rose bevel'
                    : isActive
                      ? 'border-[1.5px] border-ink/60 bg-paper bevel-in text-ink'
                      : 'border-[1.5px] border-transparent text-ink-soft hover:text-ink'
                }`
              }
            >
              <t.icon size={18} strokeWidth={2.2} />
              {t.label}
            </NavLink>
          ))}
        </div>
        <Clock />
      </div>
    </nav>
    </>
  );
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const screen = useScreen();
  const wide = useMediaQuery('(min-width: 1280px)');
  const xwide = useMediaQuery('(min-width: 1536px)');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const menu = [
    ...(screen.top ? [] : [{ label: '← 뒤로', onClick: () => navigate(-1) }]),
    { label: '새로 고침', onClick: () => qc.invalidateQueries() },
    ...(location.pathname === '/dashboard' ? [] : [{ label: '홈으로', to: '/dashboard' }]),
  ];

  return (
    <div className="min-h-dvh">
      <AppBar />
      <div className="mx-auto max-w-5xl px-2.5 pt-4 pb-28 sm:px-4 sm:pt-6 xl:grid xl:max-w-[1260px] xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-5 2xl:max-w-[1760px] 2xl:grid-cols-[270px_minmax(0,1fr)_290px]">
        {xwide && <LeftRail className="hidden 2xl:block" />}
        <main id="main" className="min-w-0">
          <Window
            title={`${screen.title} - 북모먼트`}
            tone={screen.tone}
            icon={screen.top ? screen.icon : ArrowLeft}
            menu={menu}
            closeTo={location.pathname === '/dashboard' ? undefined : '/dashboard'}
            bodyClassName="p-3.5 sm:p-6"
          >
            <Suspense fallback={<PageLoader label="페이지를 펼치는 중..." />}>
              <Outlet />
            </Suspense>
          </Window>
        </main>
        {wide && <RightRail className="hidden xl:block" />}
      </div>
      <TimerBar />
      <BadgeWatcher />
      <TabBar />
    </div>
  );
}
