import { forbidden } from '../utils/httpError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * 쿠키 인증을 쓰므로 상태 변경 요청엔 커스텀 헤더를 요구한다.
 * 다른 사이트의 form/img 요청은 커스텀 헤더를 붙일 수 없고,
 * fetch 로 붙이려면 CORS preflight 에서 차단된다.
 */
export function requireCsrfHeader(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
    throw forbidden('잘못된 요청입니다. (CSRF 보호)');
  }
  next();
}
