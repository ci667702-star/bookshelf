import { Link } from 'react-router-dom';
import { CalendarDays, LibraryBig, Palette, Ruler, Users } from 'lucide-react';
import { LogoMark } from '../components/ui/Logo.jsx';
import Button from '../components/ui/Button.jsx';
import Window from '../components/ui/Window.jsx';
import Sticker from '../components/ui/Sticker.jsx';
import ShelfScene from '../components/book/ShelfScene.jsx';
import MarathonTower from '../components/book/MarathonTower.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';

// 랜딩 일러스트용 예시 책장 (실제 사용자 데이터가 아님)
const SAMPLE = [
  ['데미안', '헤르만 헤세', 248],
  ['어린 왕자', '생텍쥐페리', 152],
  ['노인과 바다', '헤밍웨이', 140],
  ['변신', '프란츠 카프카', 120],
  ['작은 아씨들', '루이자 메이 올콧', 620],
  ['이방인', '알베르 카뮈', 180],
  ['오만과 편견', '제인 오스틴', 480],
  ['빨강 머리 앤', '몽고메리', 520],
  ['위대한 개츠비', '피츠제럴드', 260],
  ['키다리 아저씨', '진 웹스터', 300],
].map(([title, author, totalPages], i) => ({
  id: `sample-${i}`,
  status: i === 2 ? 'READING' : 'FINISHED',
  currentPage: i === 2 ? 84 : totalPages,
  book: { id: `sample-${i}`, title, author, totalPages, coverImage: null },
}));

const SAMPLE_DECO = {
  theme: 'strawberry',
  background: { color: '#FBE4E4', image: null },
  layout: { shelfStyle: 'wood', arrangement: 'spine' },
  decorations: [
    { id: 'a', kind: 'item', type: 'garland', x: 50, y: 7, rotate: 0, scale: 1 },
    { id: 'b', kind: 'sticker', type: 'heart', x: 92, y: 24, rotate: 12, scale: 0.8 },
    { id: 'c', kind: 'item', type: 'plant', x: 8, y: 80, rotate: 0, scale: 0.8 },
  ],
};

const SAMPLE_STACK = SAMPLE.slice(0, 6).map((r) => ({
  recordId: r.id,
  bookId: r.book.id,
  title: r.book.title,
  pages: r.currentPage,
  status: r.status,
}));
const SAMPLE_PAGES = SAMPLE_STACK.reduce((a, s) => a + s.pages, 0);

const FEATURES = [
  { icon: LibraryBig, tone: 'tangerine', title: '나만의 책장', sticker: 'book', body: '읽은 책, 읽는 중인 책, 읽고 싶은 책을 책장 칸칸이 꽂아요. 공개할 책장만 골라 보여 줄 수 있어요.' },
  { icon: Ruler, tone: 'butter', title: '독서 마라톤', sticker: 'star', body: '100쪽을 읽을 때마다 책탑이 1cm씩 자라요. 딸기 한 알, 머그컵, 고양이 키를 차례로 넘어 보세요.' },
  { icon: CalendarDays, tone: 'rose', title: '독서 달력', sticker: 'heart', body: '읽은 날엔 작은 표지가, 다 읽은 날엔 핀으로 꽂은 폴라로이드가 남아요.' },
  { icon: Users, tone: 'green', title: '공유 책장', sticker: 'cat', body: '초대 코드 하나로 독서 모임 친구들과 한 책장을 함께 채우고 독후감을 나눠요.' },
  { icon: Palette, tone: 'lilac', title: '책장 꾸미기', sticker: 'ribbon', body: '테마와 선반을 바꾸고 스티커와 소품을 붙여 내 방처럼 꾸며요.' },
];

export default function LandingPage() {
  useDocumentTitle(null);
  const { user } = useAuth();

  return (
    <div className="min-h-dvh">
      <header className="border-b-[1.5px] border-ink/85 bg-milk">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2" aria-label="북모먼트 홈">
            <LogoMark className="h-8 w-8" />
            <span className="wordmark text-[17px] text-cocoa-deep">북모먼트</span>
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <Button to="/dashboard" size="sm">
                내 책장으로
              </Button>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm">
                  로그인
                </Button>
                <Button to="/signup" size="sm">
                  시작하기
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-3 py-8 sm:px-4 sm:py-12">
        {/* 첫 화면 */}
        <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
          <Window title="북모먼트.exe" tone="rose" bodyClassName="p-6 sm:p-8">
            <div className="relative">
              <Sticker type="flower" className="absolute -top-2 right-0 h-12 w-12 rotate-12" />
              <p className="font-pixel text-[13px] text-ink-soft">BookMoment</p>
              <h1 className="mt-2 text-[26px] leading-[1.35] sm:text-[32px]">
                오늘 읽은 한 페이지가
                <br />
                나만의 책장이 됩니다
              </h1>
              <p className="mt-4 max-w-sm text-[14.5px] text-ink-soft">
                읽은 책을 기록하고, 책장을 꾸미고, 친구와 독서 생활을 나누는 작은 독서 SNS예요.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <Button to={user ? '/dashboard' : '/signup'} size="lg">
                  {user ? '내 책장 열기' : '무료로 책장 만들기'}
                </Button>
                {!user && (
                  <Button to="/login" variant="outline" size="lg">
                    로그인
                  </Button>
                )}
              </div>
            </div>
          </Window>
          <Window title="예시 책장 - 미리보기" tone="tangerine" bodyClassName="p-3">
            <ShelfScene records={SAMPLE} decoration={SAMPLE_DECO} linkBooks={false} minRows={2} />
            <p className="mt-2 text-center text-[12px] text-ink-soft">가입하면 나만의 빈 책장이 생겨요</p>
          </Window>
        </div>

        {/* 기능 */}
        <section aria-labelledby="features-title">
          <h2 id="features-title" className="mb-4 text-[20px]">
            책을 읽는 순간을 모아 두는 곳
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Window key={f.title} title={f.title} tone={f.tone} icon={f.icon} bodyClassName="flex gap-3 p-4">
                <Sticker type={f.sticker} className="h-11 w-11 shrink-0" />
                <p className="text-[13.5px] leading-relaxed">{f.body}</p>
              </Window>
            ))}
            <Window title="독서 마라톤 - 예시" tone="butter" icon={Ruler} bodyClassName="p-4 pt-8">
              <MarathonTower compact stack={SAMPLE_STACK} totalPages={SAMPLE_PAGES} heightCm={SAMPLE_PAGES / 100} maxHeight={120} />
            </Window>
          </div>
        </section>

        <Window title="시작하기" tone="lime" bodyClassName="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div>
            <p className="font-pixel text-[17px] font-bold">첫 책을 꽂는 데는 1분이면 충분해요</p>
            <p className="mt-1 text-[13.5px] text-ink-soft">100쪽 = 1cm, 오늘 읽은 만큼 책장이 자라요.</p>
          </div>
          <Button to={user ? '/books/new' : '/signup'} size="lg">
            {user ? '책 등록하기' : '지금 시작하기'}
          </Button>
        </Window>

        <p className="text-center font-pixel text-[11.5px] text-ink-soft">© 2026 BookMoment 북모먼트</p>
      </main>
    </div>
  );
}
