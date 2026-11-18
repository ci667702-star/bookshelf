import jwt from 'jsonwebtoken';
import { env } from './env.js';

export const AUTH_COOKIE = 'bm_token';
const SESSION_TOKEN_HOURS = 24;

export function signToken(user, remember) {
  const expiresIn = remember ? `${env.JWT_REMEMBER_DAYS}d` : `${SESSION_TOKEN_HOURS}h`;
  return jwt.sign({ sub: user.id, tv: user.tokenVersion }, env.JWT_SECRET, {
    expiresIn,
    algorithm: 'HS256',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
}

/** httpOnly 쿠키에 토큰 저장 — JS(XSS)로 탈취할 수 없도록 */
export function setAuthCookie(res, token, remember) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    // '로그인 상태 유지'를 선택하지 않으면 브라우저 종료 시 사라지는 세션 쿠키
    ...(remember ? { maxAge: env.JWT_REMEMBER_DAYS * 24 * 60 * 60 * 1000 } : {}),
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
  });
}
