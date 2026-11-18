import { prisma } from '../utils/prisma.js';
import { AUTH_COOKIE, verifyToken, clearAuthCookie } from '../utils/jwt.js';
import { unauthorized } from '../utils/httpError.js';

async function resolveUser(req) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return null;
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, nickname: true, profileImage: true, tokenVersion: true },
  });
  // 비밀번호 변경 등으로 tokenVersion 이 바뀌면 기존 토큰은 무효
  if (!user || user.tokenVersion !== payload.tv) return null;
  return user;
}

/** 로그인 필수 */
export async function requireAuth(req, res, next) {
  const user = await resolveUser(req);
  if (!user) {
    if (req.cookies?.[AUTH_COOKIE]) clearAuthCookie(res);
    throw unauthorized('로그인이 필요합니다.');
  }
  req.user = user;
  next();
}

/** 로그인하지 않아도 되지만, 로그인했다면 req.user 를 채움 */
export async function optionalAuth(req, res, next) {
  req.user = await resolveUser(req);
  next();
}
