import { rateLimit } from 'express-rate-limit';

const message = (text) => ({ error: { message: text } });

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('로그인 시도가 너무 많아요. 15분 후 다시 시도해 주세요.'),
});

/** 초대 코드 무차별 대입 방지 */
export const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: message('초대 코드 입력이 너무 많아요. 15분 후 다시 시도해 주세요.'),
});
