/**
 * 개발용 테스트 데이터 (Seed)
 *   npm run db:seed   (루트 또는 backend 폴더)
 *
 * 데모 계정 (비밀번호 모두 bookmoment123)
 *   demo@bookmoment.dev   책읽는토끼
 *   mina@bookmoment.dev   미나의서재
 *   juno@bookmoment.dev   주노
 *
 * 여러 번 실행해도 데모 계정만 지우고 다시 만든다. (다른 사용자 데이터는 건드리지 않음)
 */
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PASSWORD = 'bookmoment123';
const TZ = process.env.APP_TIMEZONE || 'Asia/Seoul';

const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
const TODAY = new Date(`${todayKey}T00:00:00.000Z`);
const daysAgo = (n) => new Date(TODAY.getTime() - n * 86400000);

// 결정적 의사난수 (실행할 때마다 같은 데이터)
let seedState = 42;
const rand = () => {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
};

const titleKey = (title, author) => {
  const norm = (s) => s.toLowerCase().replace(/[\s·.,:;!?'"«»<>《》〈〉「」『』()[\]{}\-_]/g, '');
  return `${norm(title)}|${norm(author)}`;
};

/** 시작~끝 사이 날짜에 pages 를 나눠 독서 로그 생성 (합계 = pages) */
async function createLogs(recordId, userId, pages, startAgo, endAgo, memos = []) {
  if (pages <= 0) return;
  const span = Math.max(1, startAgo - endAgo + 1);
  const sessions = Math.min(pages, Math.max(1, Math.round(span * 0.6)));
  const dayOffsets = new Set([endAgo]);
  while (dayOffsets.size < Math.min(sessions, span)) {
    dayOffsets.add(endAgo + Math.floor(rand() * span));
  }
  const days = [...dayOffsets].sort((a, b) => b - a);
  const weights = days.map(() => 0.5 + rand());
  const wsum = weights.reduce((a, b) => a + b, 0);
  let remaining = pages;
  for (let i = 0; i < days.length; i++) {
    const p = i === days.length - 1 ? remaining : Math.max(1, Math.round((pages * weights[i]) / wsum));
    const amount = Math.min(p, remaining - (days.length - 1 - i));
    if (amount <= 0) continue;
    remaining -= amount;
    await prisma.readingLog.create({
      data: {
        readingRecordId: recordId,
        userId,
        date: daysAgo(days[i]),
        pagesRead: amount,
        memo: memos[i] ?? null,
      },
    });
  }
}

async function addBook(user, shelf, b) {
  const book = await prisma.book.create({
    data: {
      createdById: user.id,
      title: b.title,
      author: b.author,
      publisher: b.publisher ?? null,
      totalPages: b.pages,
      coverImage: null,
      titleKey: titleKey(b.title, b.author),
    },
  });
  const status = b.status;
  const currentPage = status === 'FINISHED' ? b.pages : status === 'WANT_TO_READ' ? 0 : b.current;
  const record = await prisma.readingRecord.create({
    data: {
      userId: user.id,
      bookId: book.id,
      bookshelfId: shelf.id,
      status,
      currentPage,
      rating: b.rating ?? null,
      oneLineReview: b.line ?? null,
      startDate: b.startAgo != null ? daysAgo(b.startAgo) : null,
      finishDate: status === 'FINISHED' ? daysAgo(b.finishAgo) : null,
      createdAt: daysAgo(b.startAgo ?? 3),
    },
  });
  const endAgo = status === 'FINISHED' ? b.finishAgo : (b.lastAgo ?? 0);
  if (status !== 'WANT_TO_READ') await createLogs(record.id, user.id, currentPage, b.startAgo, endAgo, b.memos);
  return { book, record };
}

const DEMO_EMAILS = ['demo@bookmoment.dev', 'mina@bookmoment.dev', 'juno@bookmoment.dev'];

async function main() {
  console.log('🌱 BookMoment 데모 데이터 생성 중...');
  await prisma.user.deleteMany({ where: { email: { in: DEMO_EMAILS } } });

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const [demo, mina, juno] = await Promise.all([
    prisma.user.create({
      data: {
        email: DEMO_EMAILS[0], passwordHash, nickname: '책읽는토끼',
        bio: '퇴근길 지하철에서 한 챕터씩 읽어요.', yearlyGoalBooks: 24, monthlyGoalPages: 1500,
      },
    }),
    prisma.user.create({
      data: { email: DEMO_EMAILS[1], passwordHash, nickname: '미나의서재', bio: '소설과 에세이를 좋아해요.' },
    }),
    prisma.user.create({
      data: { email: DEMO_EMAILS[2], passwordHash, nickname: '주노', bio: '과학책과 고전을 번갈아 읽는 중' },
    }),
  ]);

  const mkShelf = async (owner, data, deco) => {
    const shelf = await prisma.bookshelf.create({ data: { ownerId: owner.id, ...data } });
    await prisma.bookshelfDecoration.create({
      data: {
        userId: owner.id,
        bookshelfId: shelf.id,
        theme: data.theme,
        background: deco.background,
        decorations: deco.decorations ?? [],
        layout: deco.layout,
      },
    });
    return shelf;
  };

  const demoMain = await mkShelf(
    demo,
    { name: '올해의 책장', description: '2026년에 만난 책들. 좋았던 문장은 독후감으로 남겨요.', isPublic: true, theme: 'strawberry' },
    {
      background: { color: '#FBE4E4', image: null },
      layout: { shelfStyle: 'scallop', arrangement: 'spine' },
      decorations: [
        { id: 'd1', kind: 'item', type: 'garland', x: 50, y: 6, rotate: 0, scale: 1.4 },
        { id: 'd2', kind: 'sticker', type: 'heart', x: 8, y: 22, rotate: -12, scale: 1 },
        { id: 'd3', kind: 'sticker', type: 'ribbon', x: 92, y: 40, rotate: 8, scale: 1.1 },
        { id: 'd4', kind: 'item', type: 'plant', x: 90, y: 86, rotate: 0, scale: 1 },
        { id: 'd5', kind: 'sticker', type: 'star', x: 12, y: 70, rotate: 14, scale: 0.9 },
      ],
    }
  );
  const demoSecret = await mkShelf(
    demo,
    { name: '몰래 읽는 책', description: '아직은 나만 보는 책장', isPublic: false, theme: 'lavender' },
    { background: { color: '#EEE7F6', image: null }, layout: { shelfStyle: 'white', arrangement: 'spine' } }
  );
  const minaShelf = await mkShelf(
    mina,
    { name: '여름밤 소설들', description: '잠 못 드는 밤에 읽은 소설 모음', isPublic: true, theme: 'sky' },
    {
      background: { color: '#E3EEF7', image: null },
      layout: { shelfStyle: 'white', arrangement: 'polaroid' },
      decorations: [
        { id: 'm1', kind: 'sticker', type: 'cloud', x: 15, y: 10, rotate: 0, scale: 1.3 },
        { id: 'm2', kind: 'sticker', type: 'star', x: 85, y: 14, rotate: 20, scale: 0.8 },
      ],
    }
  );
  const junoShelf = await mkShelf(
    juno,
    { name: '숲속 도서관', description: '느리게, 오래 읽는 책들', isPublic: true, theme: 'forest' },
    {
      background: { color: '#E4EDDF', image: null },
      layout: { shelfStyle: 'wood', arrangement: 'spine' },
      decorations: [
        { id: 'j1', kind: 'item', type: 'lamp', x: 8, y: 30, rotate: 0, scale: 1 },
        { id: 'j2', kind: 'sticker', type: 'cat', x: 88, y: 84, rotate: -6, scale: 1.1 },
      ],
    }
  );

  // ── 데모 사용자의 책 ──
  const d = {};
  d.almond = await addBook(demo, demoMain, {
    title: '아몬드', author: '손원평', publisher: '창비', pages: 264, status: 'FINISHED',
    startAgo: 88, finishAgo: 79, rating: 5, line: '감정을 배워 가는 소년의 이야기, 마지막 장에서 울었다.',
    memos: ['첫 장부터 몰입', null, '곤이 등장'],
  });
  d.store = await addBook(demo, demoMain, {
    title: '불편한 편의점', author: '김호연', publisher: '나무옆의자', pages: 268, status: 'FINISHED',
    startAgo: 70, finishAgo: 61, rating: 4, line: '따뜻한 컵라면 같은 소설',
  });
  d.dollar = await addBook(demo, demoMain, {
    title: '달러구트 꿈 백화점', author: '이미예', publisher: '팩토리나인', pages: 300, status: 'FINISHED',
    startAgo: 55, finishAgo: 44, rating: 4, line: '꿈을 사고판다는 상상이 귀여웠다.',
  });
  d.demian = await addBook(demo, demoMain, {
    title: '데미안', author: '헤르만 헤세', publisher: '민음사', pages: 248, status: 'FINISHED',
    startAgo: 38, finishAgo: 22, rating: 5, line: '새는 알에서 나오려고 투쟁한다.',
  });
  d.prince = await addBook(demo, demoMain, {
    title: '어린 왕자', author: '앙투안 드 생텍쥐페리', publisher: '열린책들', pages: 152, status: 'FINISHED',
    startAgo: 12, finishAgo: 9, rating: 5, line: '어른이 되어 다시 읽으니 전혀 다른 책',
  });
  d.boy = await addBook(demo, demoMain, {
    title: '소년이 온다', author: '한강', publisher: '창비', pages: 216, status: 'READING',
    current: 132, startAgo: 7, lastAgo: 0, memos: ['천천히 읽는 중'],
  });
  d.goodbye = await addBook(demo, demoMain, {
    title: '작별인사', author: '김영하', publisher: '복복서가', pages: 308, status: 'READING',
    current: 64, startAgo: 4, lastAgo: 1,
  });
  d.cosmos = await addBook(demo, demoMain, {
    title: '코스모스', author: '칼 세이건', publisher: '사이언스북스', pages: 720, status: 'STOPPED',
    current: 180, startAgo: 100, lastAgo: 92, line: '다음 겨울에 다시 도전!',
  });
  d.proof = await addBook(demo, demoMain, {
    title: '구의 증명', author: '최진영', publisher: '은행나무', pages: 184, status: 'WANT_TO_READ',
  });
  d.secret = await addBook(demo, demoSecret, {
    title: '미드나잇 라이브러리', author: '매트 헤이그', publisher: '인플루엔셜', pages: 400, status: 'FINISHED',
    startAgo: 30, finishAgo: 16, rating: 4,
  });

  // ── 미나의 책 ──
  const m = {};
  m.vegetarian = await addBook(mina, minaShelf, {
    title: '채식주의자', author: '한강', publisher: '창비', pages: 247, status: 'FINISHED',
    startAgo: 40, finishAgo: 30, rating: 5, line: '조용하고 강렬했다.',
  });
  m.bell = await addBook(mina, minaShelf, {
    title: '밝은 밤', author: '최은영', publisher: '문학동네', pages: 344, status: 'FINISHED',
    startAgo: 26, finishAgo: 14, rating: 5,
  });
  m.almond = await addBook(mina, minaShelf, {
    title: '아몬드', author: '손원평', publisher: '창비', pages: 264, status: 'READING',
    current: 120, startAgo: 5, lastAgo: 0,
  });

  // ── 주노의 책 ──
  const j = {};
  j.selfish = await addBook(juno, junoShelf, {
    title: '이기적 유전자', author: '리처드 도킨스', publisher: '을유문화사', pages: 632, status: 'FINISHED',
    startAgo: 60, finishAgo: 18, rating: 4, line: '천천히, 그러나 끝까지',
  });
  j.sapiens = await addBook(juno, junoShelf, {
    title: '사피엔스', author: '유발 하라리', publisher: '김영사', pages: 636, status: 'READING',
    current: 210, startAgo: 15, lastAgo: 2,
  });
  j.prince = await addBook(juno, junoShelf, {
    title: '어린 왕자', author: '앙투안 드 생텍쥐페리', publisher: '열린책들', pages: 152, status: 'FINISHED',
    startAgo: 8, finishAgo: 6, rating: 5,
  });

  // ── 독후감 ──
  const review = (user, book, data) =>
    prisma.review.create({ data: { userId: user.id, bookId: book.book.id, ...data, createdAt: data.createdAt } });

  const r1 = await review(demo, d.almond, {
    title: '감정을 모르는 소년이 배운 것',
    content:
      '처음엔 윤재의 담담한 말투가 낯설었다. 그런데 읽을수록 그 담담함이 오히려 더 많은 걸 말하고 있다는 걸 알게 됐다.\n\n곤이와 윤재가 서로를 조금씩 이해해 가는 장면들이 좋았다. 누군가를 이해한다는 건 결국 시간을 들여 곁에 있어 주는 일이라는 생각.\n\n마지막 장을 덮고 한참 동안 창밖을 봤다.',
    rating: 5, isPublic: true, createdAt: daysAgo(78),
  });
  const r2 = await review(demo, d.prince, {
    title: '어른이 되어 다시 만난 어린 왕자',
    content:
      '초등학생 때는 보아뱀 그림이 왜 모자로 보이는지 이해하지 못했다. 이번에는 여우의 말이 마음에 오래 남았다.\n\n"네가 길들인 것에 너는 언제까지나 책임이 있어."\n\n바쁘다는 이유로 연락을 미뤄 둔 친구들이 떠올라서, 책을 덮고 바로 메시지를 보냈다.',
    rating: 5, isPublic: true, createdAt: daysAgo(8),
  });
  await review(demo, d.secret, {
    title: '내가 살지 않은 삶들에 대해',
    content: '아직은 나만 보고 싶은 감상. 후회에 대해 오래 생각하게 만든 책이었다. 다음에 다시 읽고 고쳐 써야지.',
    rating: 4, isPublic: false, createdAt: daysAgo(15),
  });
  const r4 = await review(mina, m.bell, {
    title: '할머니의 할머니의 이야기',
    content:
      '사 대에 걸친 여자들의 이야기. 편지로 이어지는 장면마다 마음이 저릿했다.\n\n밝은 밤이라는 제목이 처음엔 모순처럼 느껴졌는데, 다 읽고 나니 이보다 더 맞는 제목이 없다.',
    rating: 5, isPublic: true, createdAt: daysAgo(13),
  });
  const r5 = await review(juno, j.selfish, {
    title: '유전자의 눈으로 세상 보기',
    content:
      '두 달 가까이 붙잡고 읽었다. 이타적인 행동도 유전자의 관점에서 설명할 수 있다는 주장이 처음엔 불편했지만, 읽을수록 오히려 인간이 그 프로그램을 거스를 수 있다는 마지막 장의 메시지가 크게 다가왔다.',
    rating: 4, isPublic: true, createdAt: daysAgo(17),
  });

  // ── 좋아요 · 댓글 ──
  await prisma.like.createMany({
    data: [
      { userId: mina.id, reviewId: r1.id },
      { userId: juno.id, reviewId: r1.id },
      { userId: mina.id, reviewId: r2.id },
      { userId: demo.id, reviewId: r4.id },
      { userId: juno.id, reviewId: r4.id },
      { userId: demo.id, reviewId: r5.id },
    ],
  });
  await prisma.comment.createMany({
    data: [
      { userId: mina.id, reviewId: r1.id, content: '저도 지금 아몬드 읽는 중이에요! 마지막 장 기대돼요.', createdAt: daysAgo(4) },
      { userId: juno.id, reviewId: r2.id, content: '여우 대사 정말 좋죠. 저도 이번에 다시 읽었어요.', createdAt: daysAgo(6) },
      { userId: demo.id, reviewId: r4.id, content: '읽고 싶은 책 목록에 바로 넣었어요 :)', createdAt: daysAgo(12) },
    ],
  });

  // ── 공유 책장 ──
  const club = await prisma.sharedBookshelf.create({
    data: {
      ownerId: demo.id,
      name: '토요 독서 모임',
      description: '매주 토요일 오전, 한 달에 한 권씩 같이 읽어요.',
      inviteCode: 'BOOKCLUB',
      isPublic: false,
      members: {
        create: [
          { userId: demo.id, role: 'OWNER', joinedAt: daysAgo(45) },
          { userId: mina.id, role: 'MEMBER', joinedAt: daysAgo(40) },
          { userId: juno.id, role: 'MEMBER', joinedAt: daysAgo(20) },
        ],
      },
    },
  });
  await prisma.sharedBookshelfItem.createMany({
    data: [
      { bookshelfId: club.id, readingRecordId: d.almond.record.id, addedById: demo.id, createdAt: daysAgo(44) },
      { bookshelfId: club.id, readingRecordId: d.prince.record.id, addedById: demo.id, createdAt: daysAgo(12) },
      { bookshelfId: club.id, readingRecordId: m.almond.record.id, addedById: mina.id, createdAt: daysAgo(5) },
      { bookshelfId: club.id, readingRecordId: m.bell.record.id, addedById: mina.id, createdAt: daysAgo(25) },
      { bookshelfId: club.id, readingRecordId: j.prince.record.id, addedById: juno.id, createdAt: daysAgo(8) },
    ],
  });
  await prisma.review.create({
    data: {
      userId: juno.id,
      bookId: j.prince.book.id,
      sharedBookshelfId: club.id,
      title: '모임에서 나눈 이야기 — 장미와 여우',
      content: '이번 모임에서 각자 가장 좋았던 장면을 하나씩 골랐는데 셋 다 여우 장면이었다. 다음 달 책은 다들 읽고 싶은 책에서 골라 보기로!',
      rating: 5,
      isPublic: false,
      createdAt: daysAgo(5),
    },
  });

  // 공개 공유 책장 하나 (둘러보기용)
  await prisma.sharedBookshelf.create({
    data: {
      ownerId: mina.id,
      name: '한국 소설 같이 읽기',
      description: '누구나 들어와서 요즘 읽는 한국 소설을 꽂아 주세요.',
      inviteCode: 'KNOVEL26',
      isPublic: true,
      members: { create: [{ userId: mina.id, role: 'OWNER' }] },
      items: { create: [{ readingRecordId: m.vegetarian.record.id, addedById: mina.id }] },
    },
  });

  // ── 알림 ──
  await prisma.notification.createMany({
    data: [
      { userId: demo.id, actorId: mina.id, type: 'COMMENT', reviewId: r1.id, createdAt: daysAgo(4) },
      { userId: demo.id, actorId: mina.id, type: 'LIKE', reviewId: r2.id, createdAt: daysAgo(3) },
      { userId: demo.id, actorId: juno.id, type: 'JOIN', sharedBookshelfId: club.id, isRead: true, createdAt: daysAgo(20) },
    ],
  });

  console.log('✅ 완료!');
  console.log('   데모 계정: demo@bookmoment.dev / bookmoment123  (mina@, juno@ 도 같은 비밀번호)');
  console.log('   공유 책장 초대 코드: BOOKCLUB (비공개), KNOVEL26 (공개)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
