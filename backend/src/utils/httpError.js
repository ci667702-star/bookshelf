export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message = '요청 값을 확인해 주세요.', details) =>
  new HttpError(400, message, details);
export const unauthorized = (message = '로그인이 필요합니다.') => new HttpError(401, message);
export const forbidden = (message = '권한이 없습니다.') => new HttpError(403, message);
export const notFound = (message = '찾을 수 없습니다.') => new HttpError(404, message);
export const conflict = (message = '이미 존재합니다.', details) => new HttpError(409, message, details);
