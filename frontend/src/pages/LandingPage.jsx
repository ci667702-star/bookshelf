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
      <header className="border-b-[2.5px] border-ink/90 bg-milk shadow-[0_2px_0_0_var(--color-milk),0_3px_0_0_rgb(35_62_124/0.6)]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2" aria-label="북모먼트 홈">
            <LogoMark className="h-8 w-8" />
            <span className="wordmark text-[21px] text-ink">북모먼트</span>
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

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-3 py-8 sm:px-4 sm:py-12">
        {/* 첫 화면: 분홍 표지에 남색 잉크로 찍은 책 한 권 */}
        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_1fr]">
          <section aria-labelledby="hero-title" className="relative flex rounded-[3px] border-[1.5px] border-ink bg-rose-deep shadow-[var(--shadow-pages)]">
            <div className="engraved relative min-w-0 flex-1 px-6 pt-7 pb-6 sm:px-9 sm:pt-10">
              <p className="font-serif text-[14px] font-semibold text-ink/80">나만의 책장과 독서 기록</p>
              <div className="rule-book mt-3 w-16 text-ink" aria-hidden />
              <h1
                id="hero-title"
                className="mt-6 font-serif text-[44px] leading-[1.08] font-black tracking-[-0.055em] text-ink sm:text-[58px]"
              >
                오늘 읽은
                <br />
                한 페이지가
                <br />
                나만의 책장이
                <br />
                됩니다
              </h1>
              <p className="bookish mt-6 max-w-sm text-[15px] text-ink/85">
                읽은 책을 기록하고, 책장을 꾸미고, 친구와 독서 생활을 나누는 작은 독서 SNS예요.
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <Button to={user ? '/dashboard' : '/signup'} size="lg">
                  {user ? '내 책장 열기' : '무료로 책장 만들기'}
                </Button>
                {!user && (
                  <Button to="/login" variant="outline" size="lg">
                    로그인
                  </Button>
                )}
              </div>
              <p className="mt-10 text-right font-serif text-[13px] font-semibold text-ink/80">북모먼트 지음</p>
            </div>
            {/* 책 배: 겹겹이 쌓인 종이 가장자리 */}
            <div className="page-block w-4 shrink-0 border-l-[1.5px] border-ink bg-milk sm:w-6" aria-hidden />
          </section>
          <Window title="예시 책장" tone="tangerine" bodyClassName="p-3">
            <ShelfScene records={SAMPLE} decoration={SAMPLE_DECO} linkBooks={false} minRows={2} />
            <p className="mt-2 text-center text-[12px] text-ink-soft">가입하면 나만의 빈 책장이 생겨요</p>
          </Window>
        </div>

        {/* 기능 */}
        <section aria-labelledby="features-title">
          <h2 id="features-title" className="text-[26px] font-extrabold tracking-[-0.035em]">
            책을 읽는 순간을 모아 두는 곳
          </h2>
          <div className="rule-book mt-3 mb-5 text-ink/85" aria-hidden />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Window key={f.title} title={f.title} tone={f.tone} icon={f.icon} bodyClassName="flex gap-3 p-4">
                <Sticker type={f.sticker} className="h-11 w-11 shrink-0" />
                <p className="text-[13.5px] leading-relaxed">{f.body}</p>
              </Window>
            ))}
            <Window title="독서 마라톤 예시" tone="butter" icon={Ruler} bodyClassName="p-4 pt-8">
              <MarathonTower compact stack={SAMPLE_STACK} totalPages={SAMPLE_PAGES} heightCm={SAMPLE_PAGES / 100} maxHeight={120} />
            </Window>
          </div>
        </section>

        {/* 뒤표지: 남색 면에 분홍 잉크 */}
        <section className="flex flex-wrap items-center justify-between gap-5 rounded-[3px] border-[1.5px] border-ink bg-ink px-6 py-7 text-milk shadow-[var(--shadow-misprint)] sm:px-9">
          <div>
            <p className="font-serif text-[24px] leading-snug font-extrabold tracking-[-0.035em] text-rose sm:text-[28px]">
              첫 책을 꽂는 데는 1분이면 충분해요
            </p>
            <p className="mt-1.5 text-[14px] text-milk/80">100쪽 = 1cm, 오늘 읽은 만큼 책장이 자라요.</p>
          </div>
          <Button to={user ? '/books/new' : '/signup'} variant="secondary" size="lg">
            {user ? '책 등록하기' : '지금 시작하기'}
          </Button>
        </section>

        <p className="text-center font-serif text-[12px] text-ink-soft">© 2026 BookMoment 북모먼트</p>
      </main>
    </div>
  );
}
