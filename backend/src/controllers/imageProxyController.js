import { z } from 'zod';
import { badRequest, HttpError } from '../utils/httpError.js';

/**
 * 책 표지 이미지 프록시 — "이미지로 저장" 시 다른 사이트 표지도 그림에 넣기 위해 사용 (CORS 우회)
 * SSRF 방지: 도서 검색에서 쓰는 표지 호스트만 허용, 리다이렉트 최종 주소도 다시 확인
 */
const ALLOWED_HOSTS = [
  /^t1\.daumcdn\.net$/,
  /^search\d*\.kakaocdn\.net$/,
  /^[a-z0-9-]+\.pstatic\.net$/,
  /^books\.google\.com$/,
  /^books\.googleusercontent\.com$/,
  /^covers\.openlibrary\.org$/,
  /^[a-z0-9-]+\.us\.archive\.org$/,
  /^archive\.org$/,
];
const MAX_BYTES = 5 * 1024 * 1024;

export const imageProxyQuery = z.object({ url: z.string().url().max(500) });

function allowed(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.protocol === 'https:' && ALLOWED_HOSTS.some((re) => re.test(u.hostname));
  } catch {
    return false;
  }
}

export async function imageProxy(req, res) {
  const { url } = req.valid.query;
  if (!allowed(url)) throw badRequest('허용되지 않은 이미지 주소예요.');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  let upstream;
  try {
    upstream = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'BookMoment/1.0' } });
  } catch {
    throw new HttpError(502, '이미지를 가져오지 못했어요.');
  } finally {
    clearTimeout(timer);
  }
  if (!upstream.ok || !allowed(upstream.url)) throw new HttpError(502, '이미지를 가져오지 못했어요.');
  const type = upstream.headers.get('content-type') ?? '';
  if (!/^image\/(jpeg|png|webp|gif)/.test(type)) throw new HttpError(502, '이미지 형식이 아니에요.');
  const buf = Buffer.from(await upstream.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new HttpError(413, '이미지가 너무 커요.');

  res.set({ 'Content-Type': type, 'Cache-Control': 'private, max-age=86400', 'X-Content-Type-Options': 'nosniff' });
  res.send(buf);
}
