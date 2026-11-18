import axios from 'axios';

/** 같은 출처(/api)로 요청 — 인증은 httpOnly 쿠키로 자동 전송 */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 20000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

/** 서버 오류 응답을 { message, fields, status } 형태로 통일 */
export function toApiError(err) {
  if (err?.isApiError) return err;
  const status = err?.response?.status ?? 0;
  const data = err?.response?.data?.error;
  const message =
    data?.message ||
    (status === 0 ? '서버에 연결할 수 없어요. 네트워크를 확인해 주세요.' : '요청을 처리하지 못했어요.');
  return { isApiError: true, status, message, fields: data?.fields ?? {} };
}

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const e = toApiError(err);
    // 세션 만료: /auth/me 외의 요청에서 401 → 로그아웃 처리
    if (e.status === 401 && !err.config?.url?.startsWith('/auth/')) onUnauthorized?.();
    return Promise.reject(e);
  }
);

export const get = (url, params) => api.get(url, { params }).then((r) => r.data);
export const post = (url, body) => api.post(url, body).then((r) => r.data);
export const put = (url, body) => api.put(url, body).then((r) => r.data);
export const del = (url, params) => api.delete(url, { params }).then((r) => r.data);
