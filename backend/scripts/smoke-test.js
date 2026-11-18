/**
 * API 스모크 테스트 — 실행 중인 서버(기본 http://localhost:4000)에 실제 요청을 보낸다.
 *   npm run test:smoke            (backend 폴더)
 *   API_URL=http://localhost:4000 node scripts/smoke-test.js
 * 테스트용 계정 2개를 만들고, 끝나면 스스로 탈퇴(삭제)한다.
 */
const BASE = process.env.API_URL || 'http://localhost:4000';
let passed = 0;
let failed = 0;

function client() {
  let cookie = '';
  return async function call(method, path, body, { csrf = true, raw } = {}) {
    const headers = {};
    if (cookie) headers.Cookie = cookie;
    if (csrf) headers['X-Requested-With'] = 'XMLHttpRequest';
    let payload;
    if (raw) payload = raw;
    else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    const res = await fetch(BASE + path, { method, headers, body: payload });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const m = setCookie.match(/bm_token=([^;]*)/);
      if (m) cookie = m[1] ? `bm_token=${m[1]}` : '';
    }
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
    return { status: res.status, body: json };
  };
}

function check(name, cond, extra) {
  if (cond) {
    passed++;
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.log(`  ✘ ${name}`, extra !== undefined ? JSON.stringify(extra).slice(0, 300) : '');
  }
}

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
const stamp = Date.now().toString(36);

async function main() {
  console.log(`\n📚 BookMoment smoke test → ${BASE}\n`);
  const A = client();
  const B = client();
  const pw = 'smoke1234';

  console.log('[인증]');
  let r = await A('POST', '/api/auth/register', {
    email: `a_${stamp}@smoke.test`, password: pw, passwordConfirm: pw, nickname: `에이${stamp}`.slice(0, 20),
  });
  check('A 회원가입 201', r.status === 201, r.body);
  r = await B('POST', '/api/auth/register', {
    email: `b_${stamp}@smoke.test`, password: pw, passwordConfirm: pw, nickname: `비${stamp}`.slice(0, 20),
  });
  check('B 회원가입 201', r.status === 201, r.body);
  const bId = r.body.user?.id;
  r = await client()('POST', '/api/auth/register', {
    email: `a_${stamp}@smoke.test`, password: pw, passwordConfirm: pw, nickname: `중복${stamp}`.slice(0, 20),
  });
  check('중복 이메일 409', r.status === 409, r.body);
  r = await client()('POST', '/api/auth/register', { email: 'bad', password: 'short', passwordConfirm: 'x', nickname: 'a' });
  check('유효성 검사 400 + 필드 오류', r.status === 400 && r.body.error?.fields, r.body);
  r = await client()('POST', '/api/auth/login', { email: `a_${stamp}@smoke.test`, password: 'wrongpass1' });
  check('틀린 비밀번호 401', r.status === 401, r.body);
  r = await A('GET', '/api/auth/me');
  check('me 200', r.status === 200 && r.body.user.email === `a_${stamp}@smoke.test`, r.body);
  const aId = r.body.user.id;
  r = await client()('GET', '/api/dashboard');
  check('비로그인 대시보드 401', r.status === 401, r.body);
  r = await A('POST', '/api/bookshelves', { name: 'csrf' }, { csrf: false });
  check('CSRF 헤더 없으면 403', r.status === 403, r.body);

  console.log('\n[책장 · 책 · 마라톤]');
  r = await A('GET', '/api/bookshelves');
  check('가입 시 기본 책장 생성', r.status === 200 && r.body.items.length === 1, r.body);
  const shelfId = r.body.items[0].id;

  r = await A('POST', '/api/books', {
    title: '완독한 책', author: '작가', totalPages: 300, status: 'FINISHED', rating: 5,
    startDate: today, finishDate: today, bookshelfId: shelfId,
  });
  check('완독 책 등록 201', r.status === 201, r.body);
  const finishedBookId = r.body.record?.bookId;

  r = await A('POST', '/api/books', { title: '읽는 중인 책', author: '작가', totalPages: 400, status: 'READING', currentPage: 120 });
  check('읽는 중 책 등록 201 (기본 책장)', r.status === 201 && r.body.record.bookshelfId === shelfId, r.body);
  const readingRecordId = r.body.record?.id;
  const readingBookId = r.body.record?.bookId;

  r = await A('POST', '/api/books', { title: ' 완독한  책', author: '작가', totalPages: 300 });
  check('같은 책 중복 등록 409', r.status === 409, r.body);

  r = await A('GET', '/api/reading/marathon');
  check('마라톤 누적 = 300 + 120 = 420쪽', r.body.totalPages === 420, r.body);
  check('누적 높이 = 4.2cm', r.body.heightCm === 4.2, r.body.heightCm);

  r = await A('POST', `/api/reading/${readingRecordId}/logs`, { pagesRead: 30, memo: '재밌다' });
  check('오늘 30쪽 기록 → 현재 150쪽', r.status === 201 && r.body.record.currentPage === 150, r.body);
  const logId = r.body.log?.id;
  r = await A('POST', `/api/reading/${readingRecordId}/logs`, { toPage: 100 });
  check('뒤로 가는 페이지 400', r.status === 400, r.body);

  r = await A('GET', '/api/reading/calendar');
  check('달력 오늘 = 300 + 120 + 30 = 450쪽', r.body.days?.[today]?.pages === 450, r.body.days?.[today]);
  check('달력 오늘 완독 배지 1권', r.body.days?.[today]?.finished?.length === 1);

  r = await A('DELETE', `/api/reading/logs/${logId}`);
  check('로그 삭제 → 120쪽으로 복귀', r.status === 200 && r.body.record.currentPage === 120, r.body);

  r = await A('PUT', `/api/books/${readingBookId}`, { status: 'FINISHED' });
  check('완독 처리', r.status === 200 && r.body.record.status === 'FINISHED', r.body);
  r = await A('GET', '/api/reading/marathon');
  check('완독 후 누적 700쪽 / 7cm (중복 집계 없음)', r.body.totalPages === 700 && r.body.heightCm === 7, r.body);
  r = await A('GET', '/api/reading/calendar');
  check('달력 합계도 700쪽', r.body.stats?.totalPages === 700, r.body.stats);

  r = await A('PUT', `/api/books/${readingBookId}`, { status: 'READING', currentPage: 50 });
  check('진행 줄이기 → 로그도 차감', r.status === 200 && r.body.record.currentPage === 50, r.body);
  r = await A('GET', '/api/reading/marathon');
  check('누적 350쪽', r.body.totalPages === 350, r.body.totalPages);

  console.log('\n[권한 · 비공개]');
  r = await B('GET', `/api/bookshelves/${shelfId}`);
  check('B → A 비공개 책장 404', r.status === 404, r.body);
  r = await B('GET', `/api/books/${finishedBookId}`);
  check('B → 비공개 책장의 책 404', r.status === 404, r.body);
  r = await B('PUT', `/api/books/${finishedBookId}`, { title: 'hack' });
  check('B → A 책 수정 403', r.status === 403, r.body);
  r = await B('DELETE', `/api/books/${finishedBookId}`);
  check('B → A 책 삭제 403', r.status === 403, r.body);
  r = await A('PUT', `/api/bookshelves/${shelfId}`, { isPublic: true });
  check('A 책장 공개 전환', r.status === 200 && r.body.shelf.isPublic, r.body);
  r = await B('GET', `/api/bookshelves/${shelfId}`);
  check('B → 공개 책장 200, 책 2권', r.status === 200 && r.body.records.length === 2 && !r.body.isOwner, r.body);
  r = await B('PUT', `/api/bookshelves/${shelfId}`, { name: 'hack' });
  check('B → A 책장 수정 403', r.status === 403, r.body);

  console.log('\n[독후감 · 좋아요 · 댓글]');
  r = await A('POST', '/api/reviews', { bookId: finishedBookId, title: '비공개 독후감', content: '아직은 나만 보고 싶은 감상입니다.', isPublic: false });
  check('비공개 독후감 작성', r.status === 201, r.body);
  const reviewId = r.body.review?.id;
  r = await B('GET', `/api/reviews/${reviewId}`);
  check('B → 비공개 독후감 404', r.status === 404, r.body);
  r = await B('POST', `/api/reviews/${reviewId}/like`);
  check('B → 비공개 독후감 좋아요 404', r.status === 404, r.body);
  r = await A('PUT', `/api/reviews/${reviewId}`, { isPublic: true });
  check('공개로 전환', r.status === 200 && r.body.review.isPublic, r.body);
  r = await B('POST', `/api/reviews/${reviewId}/like`);
  check('B 좋아요', r.status === 200 && r.body.liked && r.body.likeCount === 1, r.body);
  r = await B('POST', `/api/reviews/${reviewId}/comments`, { content: '저도 읽어보고 싶어요!' });
  check('B 댓글', r.status === 201, r.body);
  r = await B('PUT', `/api/reviews/${reviewId}`, { title: 'hack' });
  check('B → A 독후감 수정 403', r.status === 403, r.body);
  r = await B('POST', '/api/reviews', { bookId: finishedBookId, title: '남의 책', content: '남의 책으로 쓰는 독후감' });
  check('B → 남의 책으로 독후감 400', r.status === 400, r.body);
  r = await A('GET', '/api/notifications');
  check('A 알림 2개 (좋아요, 댓글)', r.body.unreadCount === 2, r.body);

  console.log('\n[공유 책장 · 초대 코드]');
  r = await A('POST', '/api/shared-bookshelves', { name: '독서 모임', description: '같이 읽어요' });
  check('공유 책장 생성 + 8자리 코드', r.status === 201 && /^[A-Z2-9]{8}$/.test(r.body.shelf.inviteCode), r.body);
  const sharedId = r.body.shelf.id;
  const code = r.body.shelf.inviteCode;
  r = await B('GET', `/api/shared-bookshelves/${sharedId}`);
  check('B 참여 전 비공개 공유 책장 404', r.status === 404, r.body);
  r = await B('POST', '/api/shared-bookshelves/join', { inviteCode: 'ZZZZZZZZ' });
  check('잘못된 코드 404', r.status === 404, r.body);
  r = await B('POST', '/api/shared-bookshelves/join', { inviteCode: code.toLowerCase() });
  check('초대 코드로 참여 201', r.status === 201, r.body);
  r = await B('POST', '/api/shared-bookshelves/join', { inviteCode: code });
  check('중복 참여 409', r.status === 409, r.body);
  r = await B('POST', '/api/books', { title: 'B의 책', author: '작가B', totalPages: 200, status: 'FINISHED', sharedBookshelfId: sharedId });
  check('B 책 등록과 동시에 공유 책장에 꽂기', r.status === 201, r.body);
  r = await A('POST', `/api/shared-bookshelves/${sharedId}/items`, { readingRecordId: readingRecordId });
  check('A 자기 책 꽂기', r.status === 201, r.body);
  const aItemId = r.body.item?.id;
  r = await B('POST', `/api/shared-bookshelves/${sharedId}/items`, { readingRecordId: readingRecordId });
  check('B → A 기록 꽂기 403', r.status === 403, r.body);
  r = await B('DELETE', `/api/shared-bookshelves/${sharedId}/items/${aItemId}`);
  check('B → A가 꽂은 책 빼기 403', r.status === 403, r.body);
  r = await B('GET', `/api/shared-bookshelves/${sharedId}`);
  check('공동 통계: 2명, 2권, 250쪽', r.body.members?.length === 2 && r.body.stats?.books === 2 && r.body.stats?.pages === 250, r.body.stats);
  check('참여자는 초대 코드 확인 가능', r.body.shelf?.inviteCode === code);
  r = await B('DELETE', `/api/shared-bookshelves/${sharedId}`);
  check('B → 공유 책장 삭제 403', r.status === 403, r.body);
  r = await A('DELETE', `/api/shared-bookshelves/${sharedId}/leave`);
  check('소유자 나가기 400', r.status === 400, r.body);
  r = await B('DELETE', `/api/shared-bookshelves/${sharedId}/leave`);
  check('B 나가기', r.status === 200, r.body);
  r = await B('GET', `/api/shared-bookshelves/${sharedId}`);
  check('나간 뒤 접근 404', r.status === 404, r.body);

  console.log('\n[꾸미기 · 검색 · 대시보드 · 업로드]');
  r = await A('PUT', `/api/bookshelves/${shelfId}/decoration`, {
    theme: 'strawberry', background: { color: '#FBE4E4', image: null },
    decorations: [{ id: 's1', kind: 'sticker', type: 'heart', x: 20, y: 30, rotate: 10, scale: 1.2 }],
    layout: { shelfStyle: 'scallop', arrangement: 'polaroid' },
  });
  check('꾸미기 저장', r.status === 200 && r.body.decoration.theme === 'strawberry', r.body);
  r = await A('PUT', `/api/bookshelves/${shelfId}/decoration`, {
    theme: 'strawberry', background: { color: 'red', image: 'javascript:alert(1)' }, decorations: [], layout: { shelfStyle: 'wood', arrangement: 'cover' },
  });
  check('잘못된 꾸미기 값 400', r.status === 400, r.body);
  r = await B('PUT', `/api/bookshelves/${shelfId}/decoration`, {
    theme: 'cream', background: { color: '#FFFFFF', image: null }, decorations: [], layout: { shelfStyle: 'wood', arrangement: 'cover' },
  });
  check('B → A 꾸미기 403', r.status === 403, r.body);
  r = await B('GET', `/api/bookshelves/${shelfId}`);
  check('꾸미기 결과 유지', r.body.decoration?.layout?.arrangement === 'polaroid', r.body.decoration);

  r = await B('GET', `/api/search?q=${encodeURIComponent('완독한')}`);
  check('검색: 공개 책장의 책', r.status === 200 && r.body.books.length >= 1, r.body);
  r = await A('GET', '/api/dashboard');
  check('대시보드', r.status === 200 && r.body.stats.totalPages === 350, r.body.stats);

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    'base64'
  );
  let fd = new FormData();
  fd.append('file', new Blob([png], { type: 'image/png' }), 'dot.png');
  r = await A('POST', '/api/uploads', undefined, { raw: fd });
  check('PNG 업로드', r.status === 201 && r.body.url?.startsWith('/uploads/'), r.body);
  fd = new FormData();
  fd.append('file', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'evil.png');
  r = await A('POST', '/api/uploads', undefined, { raw: fd });
  check('가짜 PNG(스크립트) 차단 400', r.status === 400, r.body);
  fd = new FormData();
  fd.append('file', new Blob(['<svg/>'], { type: 'image/svg+xml' }), 'x.svg');
  r = await A('POST', '/api/uploads', undefined, { raw: fd });
  check('SVG 확장자 차단 400', r.status === 400, r.body);

  console.log('\n[문장 · 팔로우 · 피드 · 배지 · 타이머]');
  r = await A('POST', '/api/quotes', { bookId: finishedBookId, content: '마음에 남은 문장', page: 12, isPublic: false });
  check('비공개 문장 저장', r.status === 201, r.body);
  const quoteId = r.body.quote?.id;
  r = await B('GET', `/api/quotes?scope=book&bookId=${finishedBookId}`);
  check('B → 비공개 문장 안 보임', r.status === 200 && r.body.items.length === 0, r.body);
  r = await A('PUT', `/api/quotes/${quoteId}`, { isPublic: true });
  r = await B('GET', `/api/quotes?scope=book&bookId=${finishedBookId}`);
  check('공개 후 B 에게 보임', r.body.items?.length === 1, r.body);
  r = await B('PUT', `/api/quotes/${quoteId}`, { content: 'hack' });
  check('B → A 문장 수정 403', r.status === 403, r.body);
  r = await A('POST', '/api/quotes', { bookId: finishedBookId, content: '쪽수 초과', page: 99999 });
  check('책 쪽수보다 큰 페이지 400', r.status === 400, r.body);

  r = await B('POST', `/api/users/${bId}/follow`);
  check('자기 자신 팔로우 400', r.status === 400, r.body);
  r = await B('POST', `/api/users/${aId}/follow`);
  check('B → A 팔로우', r.status === 200 && r.body.following && r.body.followerCount === 1, r.body);
  r = await B('GET', '/api/feed');
  check('B 친구 소식에 A 활동', r.status === 200 && r.body.items.some((i) => i.user.id === aId), r.body);
  r = await B('GET', `/api/users/${aId}`);
  check('프로필 팔로우 상태', r.body.isFollowing === true && r.body.followerCount === 1, r.body);

  r = await A('GET', '/api/badges');
  check(
    '배지: 첫 완독 획득 + 딸기 스티커 해금',
    r.body.badges?.find((b) => b.key === 'first_finish')?.earned && r.body.unlockedStickers.includes('strawberry'),
    r.body
  );
  const decoWith = (type) => ({
    theme: 'cream',
    background: { color: '#FFF9F2', image: null },
    decorations: [{ id: 'k', kind: 'sticker', type, x: 10, y: 10, rotate: 0, scale: 1 }],
    layout: { shelfStyle: 'wood', arrangement: 'spine' },
  });
  r = await A('PUT', `/api/bookshelves/${shelfId}/decoration`, decoWith('crown'));
  check('잠긴 스티커(왕관) 사용 403', r.status === 403, r.body);
  r = await A('PUT', `/api/bookshelves/${shelfId}/decoration`, decoWith('strawberry'));
  check('해금된 스티커(딸기) 사용', r.status === 200, r.body);

  r = await A('POST', `/api/reading/${readingRecordId}/timer`);
  check('타이머 시작', r.status === 201 && r.body.session?.record?.id === readingRecordId, r.body);
  r = await A('POST', `/api/reading/${readingRecordId}/timer`);
  check('같은 책 다시 시작하면 기존 타이머 유지', r.status === 200, r.body);
  r = await A('GET', '/api/reading/timer');
  check('타이머 상태 조회', !!r.body.session, r.body);
  r = await A('POST', '/api/reading/timer/stop', { pagesRead: 10, memo: '집중!' });
  check('타이머 정지 → 10쪽 + 시간 기록', r.status === 200 && r.body.record.currentPage === 60 && r.body.minutes >= 1, r.body);
  r = await A('POST', '/api/reading/timer/stop', { pagesRead: 1 });
  check('타이머 없을 때 정지 404', r.status === 404, r.body);

  r = await A('GET', `/api/image-proxy?url=${encodeURIComponent('https://example.com/a.png')}`);
  check('허용 안 된 이미지 주소 차단 400', r.status === 400, r.body);
  r = await A('GET', `/api/image-proxy?url=${encodeURIComponent('http://169.254.169.254/latest')}`);
  check('내부 주소 차단(SSRF) 400', r.status === 400, r.body);

  console.log('\n[정리]');
  r = await A('POST', '/api/auth/logout');
  r = await A('GET', '/api/auth/me');
  check('로그아웃 후 401', r.status === 401, r.body);
  await A('POST', '/api/auth/login', { email: `a_${stamp}@smoke.test`, password: pw });
  r = await A('DELETE', '/api/users/me', { password: pw });
  check('A 탈퇴', r.status === 200, r.body);
  r = await B('DELETE', '/api/users/me', { password: pw });
  check('B 탈퇴', r.status === 200, r.body);

  console.log(`\n결과: ${passed} 통과, ${failed} 실패\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
