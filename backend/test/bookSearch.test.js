// 도서 검색 변환 로직 테스트 — 실제 외부 API 는 부르지 않고 fetch 를 가짜로 바꿔서 확인
// 실행: npm test -w backend
import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

// env.js 가 필수값을 검사하므로 import 전에 채운다 (backend/.env 의 다른 검색 키가 끼어들지 않게 비워 둠)
Object.assign(process.env, {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
  JWT_SECRET: process.env.JWT_SECRET || 'test-secret-test-secret-test-secret-123',
  NLK_API_KEY: 'TESTKEY',
  KAKAO_REST_API_KEY: '',
  NAVER_CLIENT_ID: '',
  NAVER_CLIENT_SECRET: '',
  GOOGLE_BOOKS_API_KEY: '',
});

const { mapNlk, nlkAuthor, nlkPages, nlkCover, nlkTitle, searchBooks, lookupPages } = await import(
  '../src/services/bookSearchService.js'
);

const realFetch = globalThis.fetch;
let calls = [];
/** routes: [정규식, 응답 JSON 또는 (url) => JSON] — 위에서부터 처음 맞는 것 */
function mockFetch(routes) {
  calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    const hit = routes.find(([re]) => re.test(String(url)));
    if (!hit) return new Response('not found', { status: 404 });
    const body = typeof hit[1] === 'function' ? hit[1](String(url)) : hit[1];
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  };
}
beforeEach(() => (calls = []));
after(() => (globalThis.fetch = realFetch));

// 국립중앙도서관 문서의 출력 항목 그대로 만든 예시 응답
const NLK_SAMPLE = {
  PAGE_NO: '1',
  TOTAL_COUNT: '3',
  docs: [
    {
      TITLE: '어린 왕자 = Le petit prince',
      VOL: '',
      AUTHOR: '앙투안 드 생텍쥐페리 (Saint-Exupéry, Antoine de) 지음 ; 김화영 옮김',
      PUBLISHER: '문학동네',
      EA_ISBN: '9788954620208',
      PAGE: 'xii, 160 p.',
      TITLE_URL: 'http://seoji.nl.go.kr/fu/ecip/dbfiles/CIP_FILES_TBL/2013/01/9788954620208.jpg',
      PUBLISH_PREDATE: '20130115',
      EBOOK_YN: 'N',
    },
    {
      TITLE: '어린 왕자',
      AUTHOR: '생텍쥐페리 지음',
      PUBLISHER: '문학동네',
      EA_ISBN: '9788954699999',
      PAGE: '',
      TITLE_URL: '',
      PUBLISH_PREDATE: '2020',
      EBOOK_YN: 'Y',
    },
    {
      TITLE: '토지',
      VOL: '1',
      AUTHOR: '지은이: 박경리',
      PUBLISHER: '마로니에북스',
      EA_ISBN: '9788960530001',
      PAGE: '480쪽',
      TITLE_URL: 'https://www.nl.go.kr/seoji/fu/ecip/dbfiles/CIP_FILES_TBL/2012/08/9788960530001.jpg',
      PUBLISH_PREDATE: '20120801',
      EBOOK_YN: 'N',
    },
  ],
};

test('국립중앙도서관 응답 → 책 정보로 변환', () => {
  const items = mapNlk(NLK_SAMPLE);
  assert.equal(items.length, 3);
  assert.deepEqual(items[0], {
    title: '어린 왕자',
    author: '앙투안 드 생텍쥐페리',
    publisher: '문학동네',
    coverImage: 'https://www.nl.go.kr/seoji/fu/ecip/dbfiles/CIP_FILES_TBL/2013/01/9788954620208.jpg',
    totalPages: 160,
    isbn: '9788954620208',
    pubYear: '2013',
  });
  // 종이책이 먼저, 전자책은 맨 뒤로
  assert.equal(items[1].title, '토지 1');
  assert.equal(items[1].author, '박경리');
  assert.equal(items[1].totalPages, 480);
  assert.equal(items[2].isbn, '9788954699999');
  assert.equal(items[2].coverImage, null);
  assert.equal(items[2].totalPages, null);
  assert.equal(mapNlk({}).length, 0);
});

test('저자 이름에서 역할어 정리', () => {
  const cases = [
    ['한강 지음', '한강'],
    ['한강 지음 ; 김화영 옮김', '한강'],
    ['지은이: 김영하', '김영하'],
    ['지은이:김영하', '김영하'],
    ['백희나 글·그림', '백희나'],
    ['김영하, 정이현 지음', '김영하, 정이현'],
    ['김영하 지음, 홍길동 그림', '김영하, 홍길동'],
    ['J. K. 롤링 저', 'J. K. 롤링'],
    ['요나스 요나손 (Jonasson, Jonas) 지음', '요나스 요나손'],
    ['김민수 (글)', '김민수'],
    ['최인역', '최인역'], // 이름 끝 글자 '역'은 지우지 않는다
    ['박정편', '박정편'],
    ['', ''],
  ];
  for (const [raw, want] of cases) assert.equal(nlkAuthor(raw), want, raw);
});

test('쪽수 · 표지 · 제목 정리', () => {
  assert.equal(nlkPages('320 p.'), 320);
  assert.equal(nlkPages('xii, 320 p. ; 21 cm'), 320);
  assert.equal(nlkPages('320쪽'), 320);
  assert.equal(nlkPages('320'), 320);
  assert.equal(nlkPages(''), null);
  assert.equal(nlkPages('1책'), null);
  assert.equal(nlkPages('99999 p.'), null);

  assert.equal(nlkCover('http://seoji.nl.go.kr/fu/a.jpg'), 'https://www.nl.go.kr/seoji/fu/a.jpg');
  assert.equal(nlkCover('http://www.nl.go.kr/seoji/fu/a.jpg'), 'https://www.nl.go.kr/seoji/fu/a.jpg');
  assert.equal(nlkCover('/seoji/fu/a.jpg'), 'https://www.nl.go.kr/seoji/fu/a.jpg');
  assert.equal(nlkCover('  '), null);
  assert.equal(nlkCover(null), null);

  assert.equal(nlkTitle('<b>토지</b>', '2'), '토지 2');
});

const NLK_URL = /^https:\/\/www\.nl\.go\.kr\/seoji\/SearchApi\.do\?/;
const GOOGLE_URL = /^https:\/\/www\.googleapis\.com\/books\/v1\/volumes/;
const GOOGLE_SAMPLE = { items: [{ volumeInfo: { title: 'Google Book', authors: ['A'], pageCount: 99 } }] };

test('검색: 키가 있으면 국립중앙도서관이 1순위, 제목 검색 주소가 맞다', async () => {
  mockFetch([[NLK_URL, NLK_SAMPLE]]);
  const res = await searchBooks('어린 왕자');
  assert.equal(res.provider, 'nlk');
  assert.equal(res.providerLabel, '국립중앙도서관');
  assert.equal(res.items.length, 3);
  const u = new URL(calls[0]);
  assert.equal(u.searchParams.get('cert_key'), 'TESTKEY');
  assert.equal(u.searchParams.get('result_style'), 'json');
  assert.equal(u.searchParams.get('title'), '어린 왕자');
  assert.equal(u.searchParams.get('page_size'), '10');
});

test('검색: 바코드 ISBN 은 isbn 파라미터로', async () => {
  mockFetch([[NLK_URL, NLK_SAMPLE]]);
  await searchBooks('978-89-5462-020-8');
  const u = new URL(calls[0]);
  assert.equal(u.searchParams.get('isbn'), '9788954620208');
  assert.equal(u.searchParams.get('title'), null);
});

test('검색: 제목으로 없으면 저자로 한 번 더', async () => {
  mockFetch([
    [/[?&]title=/, { TOTAL_COUNT: '0', docs: [] }],
    [/[?&]author=/, NLK_SAMPLE],
  ]);
  const res = await searchBooks('박경리');
  assert.equal(res.provider, 'nlk');
  assert.equal(calls.length, 2);
  assert.equal(new URL(calls[1]).searchParams.get('author'), '박경리');
});

test('검색: 인증키 오류(200 + RESULT ERROR)면 다음 제공처로 넘어간다', async () => {
  mockFetch([
    [NLK_URL, { RESULT: 'ERROR', ERR_CODE: '011', ERR_MESSAGE: '유효하지 않은 인증키 값입니다.' }],
    [GOOGLE_URL, GOOGLE_SAMPLE],
  ]);
  const warn = console.warn;
  console.warn = () => {};
  try {
    const res = await searchBooks('아무 책');
    assert.equal(res.provider, 'google');
    assert.equal(res.items[0].title, 'Google Book');
  } finally {
    console.warn = warn;
  }
});

test('쪽수 조회: 국립중앙도서관 먼저, 없으면 Google Books', async () => {
  mockFetch([[NLK_URL, NLK_SAMPLE], [GOOGLE_URL, GOOGLE_SAMPLE]]);
  assert.equal(await lookupPages('9788954620208'), 160);
  assert.equal(calls.length, 1);

  mockFetch([[NLK_URL, { TOTAL_COUNT: '1', docs: [{ TITLE: 'x', PAGE: '' }] }], [GOOGLE_URL, GOOGLE_SAMPLE]]);
  assert.equal(await lookupPages('9788954620208'), 99);
  assert.equal(calls.length, 2);
});
