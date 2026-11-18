import { env } from '../utils/env.js';
import { HttpError } from '../utils/httpError.js';

/**
 * 외부 도서 검색 (표지 · 제목 · 저자 · 출판사 자동 채우기)
 * 키가 설정된 순서대로 시도: 카카오(다음) → 네이버 → Google Books → Open Library(키 없음, 영문 도서 위주)
 * 교보문고는 공개 API 를 제공하지 않는다.
 */

const TIMEOUT_MS = 6000;

async function getJson(url, headers = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const ENTITIES = { '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&#39;': "'", '&apos;': "'" };
export const stripTags = (s) =>
  String(s ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&(quot|amp|lt|gt|#39|apos);/g, (m) => ENTITIES[m])
    .trim();

const toHttps = (u) => (u ? String(u).replace(/^http:\/\//i, 'https://') : null);
const clip = (s, n) => (s ? String(s).slice(0, n) : s);

/** 'ISBN10 ISBN13' 형태에서 13자리를 우선 */
export function pickIsbn(raw) {
  const parts = String(raw ?? '').split(/[\s,]+/);
  return parts.find((x) => /^\d{13}$/.test(x)) ?? parts.find((x) => /^\d{9}[\dX]$/i.test(x)) ?? null;
}

/** 카카오 썸네일(120px)은 fname 파라미터에 원본 이미지 주소가 들어 있다 */
export function kakaoCover(thumb) {
  if (!thumb) return null;
  try {
    const original = new URL(thumb).searchParams.get('fname');
    return toHttps(original || thumb);
  } catch {
    return toHttps(thumb);
  }
}

function normalize(item) {
  return {
    title: clip(item.title, 200),
    author: clip(item.author || '저자 미상', 120),
    publisher: clip(item.publisher, 120) || null,
    coverImage: item.coverImage && item.coverImage.length <= 500 ? item.coverImage : null,
    totalPages: item.totalPages || null,
    isbn: item.isbn || null,
    pubYear: item.pubYear || null,
  };
}

export const mapKakao = (json) =>
  (json.documents ?? []).map((d) =>
    normalize({
      title: d.title,
      author: (d.authors ?? []).join(', '),
      publisher: d.publisher,
      coverImage: kakaoCover(d.thumbnail),
      isbn: pickIsbn(d.isbn),
      pubYear: d.datetime ? String(d.datetime).slice(0, 4) : null,
    })
  );

export const mapNaver = (json) =>
  (json.items ?? []).map((i) =>
    normalize({
      title: stripTags(i.title),
      author: stripTags(i.author).split('^').join(', '),
      publisher: stripTags(i.publisher),
      coverImage: toHttps(i.image),
      isbn: pickIsbn(i.isbn),
      pubYear: i.pubdate ? String(i.pubdate).slice(0, 4) : null,
    })
  );

export const mapGoogle = (json) =>
  (json.items ?? []).map(({ volumeInfo: v = {} }) =>
    normalize({
      title: [v.title, v.subtitle].filter(Boolean).join(': '),
      author: (v.authors ?? []).join(', '),
      publisher: v.publisher,
      coverImage: toHttps(v.imageLinks?.thumbnail?.replace('&edge=curl', '') ?? null),
      totalPages: v.pageCount,
      isbn: (v.industryIdentifiers ?? []).find((x) => x.type === 'ISBN_13')?.identifier ?? null,
      pubYear: v.publishedDate ? String(v.publishedDate).slice(0, 4) : null,
    })
  );

export const mapOpenLibrary = (json) =>
  (json.docs ?? []).map((d) =>
    normalize({
      title: d.title,
      author: (d.author_name ?? []).slice(0, 3).join(', '),
      publisher: (d.publisher ?? [])[0],
      coverImage: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null,
      totalPages: d.number_of_pages_median,
      isbn: pickIsbn((d.isbn ?? []).join(' ')),
      pubYear: d.first_publish_year ? String(d.first_publish_year) : null,
    })
  );

const googleKey = () => (env.GOOGLE_BOOKS_API_KEY ? `&key=${encodeURIComponent(env.GOOGLE_BOOKS_API_KEY)}` : '');

const PROVIDERS = [
  {
    name: 'kakao',
    label: '카카오',
    enabled: () => !!env.KAKAO_REST_API_KEY,
    search: async (q) =>
      mapKakao(
        await getJson(`https://dapi.kakao.com/v3/search/book?size=10${isIsbn(q) ? '&target=isbn' : ''}&query=${encodeURIComponent(q)}`, {
          Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}`,
        })
      ),
  },
  {
    name: 'naver',
    label: '네이버',
    enabled: () => !!(env.NAVER_CLIENT_ID && env.NAVER_CLIENT_SECRET),
    search: async (q) =>
      mapNaver(
        await getJson(
          isIsbn(q)
            ? `https://openapi.naver.com/v1/search/book_adv.json?display=10&d_isbn=${encodeURIComponent(q)}`
            : `https://openapi.naver.com/v1/search/book.json?display=10&query=${encodeURIComponent(q)}`,
          {
          'X-Naver-Client-Id': env.NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': env.NAVER_CLIENT_SECRET,
        })
      ),
  },
  {
    name: 'google',
    label: 'Google Books',
    enabled: () => true,
    search: async (q) =>
      mapGoogle(
        await getJson(
          `https://www.googleapis.com/books/v1/volumes?maxResults=10&printType=books&q=${isIsbn(q) ? 'isbn:' : ''}${encodeURIComponent(q)}${googleKey()}`
        )
      ),
  },
  {
    // 키 없이 쓸 수 있는 마지막 대안 (영문 도서 위주, 한국 도서는 거의 없음)
    name: 'openlibrary',
    label: 'Open Library',
    enabled: () => true,
    search: async (q) =>
      mapOpenLibrary(
        await getJson(
          `https://openlibrary.org/search.json?limit=10&fields=title,author_name,publisher,cover_i,isbn,number_of_pages_median,first_publish_year&${isIsbn(q) ? 'isbn' : 'q'}=${encodeURIComponent(q)}`,
          { 'User-Agent': 'BookMoment/1.0 (reading log app)' }
        )
      ),
  },
];

/** 바코드로 읽은 ISBN(10/13자리)인지 */
export const isIsbn = (q) => /^(97[89]\d{10}|\d{9}[\dX])$/i.test(q);

export async function searchBooks(rawQ) {
  const compact = rawQ.replace(/[-\s]/g, '');
  const q = isIsbn(compact) ? compact : rawQ;
  const errors = [];
  for (const p of PROVIDERS.filter((x) => x.enabled())) {
    try {
      const items = (await p.search(q)).filter((i) => i.title);
      if (items.length) return { provider: p.name, providerLabel: p.label, items };
    } catch (err) {
      errors.push(`${p.name}: ${err.status ?? err.name}`);
    }
  }
  if (errors.length) {
    console.warn('[book-search] 외부 도서 검색 실패 —', errors.join(', '), '(.env 의 KAKAO_REST_API_KEY 등을 확인하세요)');
    throw new HttpError(503, '책 검색 서비스에 연결하지 못했어요. 잠시 후 다시 시도하거나 직접 입력해 주세요.');
  }
  return { provider: null, providerLabel: null, items: [] };
}

/** ISBN 으로 페이지 수 찾기 (카카오 · 네이버는 페이지 수를 주지 않아 Google Books 로 보충) */
export async function lookupPages(isbn) {
  try {
    const json = await getJson(`https://www.googleapis.com/books/v1/volumes?maxResults=1&q=isbn:${encodeURIComponent(isbn)}${googleKey()}`);
    return json.items?.[0]?.volumeInfo?.pageCount ?? null;
  } catch {
    return null;
  }
}
