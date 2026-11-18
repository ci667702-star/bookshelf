import { api, get, post, put, del } from './api.js';

export const authApi = {
  me: () => get('/auth/me'),
  login: (body) => post('/auth/login', body),
  logout: () => post('/auth/logout'),
  /** 프로필 이미지(선택)를 함께 보내기 위해 multipart 사용 */
  register: ({ profileFile, ...fields }) => {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    if (profileFile) fd.append('profileImage', profileFile);
    return api.post('/auth/register', fd).then((r) => r.data);
  },
};

export const userApi = {
  profile: (id) => get(`/users/${id}`),
  updateMe: (body) => put('/users/me', body),
  changePassword: (body) => put('/users/me/password', body),
  deleteMe: (password) => api.delete('/users/me', { data: { password } }).then((r) => r.data),
};

export const shelfApi = {
  list: (params) => get('/bookshelves', params),
  get: (id) => get(`/bookshelves/${id}`),
  create: (body) => post('/bookshelves', body),
  update: (id, body) => put(`/bookshelves/${id}`, body),
  remove: (id, moveTo) => del(`/bookshelves/${id}`, moveTo ? { moveTo } : undefined),
  getDecoration: (id) => get(`/bookshelves/${id}/decoration`),
  saveDecoration: (id, body) => put(`/bookshelves/${id}/decoration`, body),
};

export const bookApi = {
  list: (params) => get('/books', params),
  get: (id) => get(`/books/${id}`),
  create: (body) => post('/books', body),
  update: (id, body) => put(`/books/${id}`, body),
  remove: (id) => del(`/books/${id}`),
};

export const readingApi = {
  list: (params) => get('/reading', params),
  update: (id, body) => put(`/reading/${id}`, body),
  remove: (id) => del(`/reading/${id}`),
  addLog: (id, body) => post(`/reading/${id}/logs`, body),
  logs: (id) => get(`/reading/${id}/logs`),
  removeLog: (logId) => del(`/reading/logs/${logId}`),
  calendar: (year, month) => get('/reading/calendar', { year, month }),
  marathon: () => get('/reading/marathon'),
};

export const reviewApi = {
  list: (params) => get('/reviews', params),
  get: (id) => get(`/reviews/${id}`),
  create: (body) => post('/reviews', body),
  update: (id, body) => put(`/reviews/${id}`, body),
  remove: (id) => del(`/reviews/${id}`),
  like: (id) => post(`/reviews/${id}/like`),
  comments: (id) => get(`/reviews/${id}/comments`),
  addComment: (id, content) => post(`/reviews/${id}/comments`, { content }),
  removeComment: (id, commentId) => del(`/reviews/${id}/comments/${commentId}`),
};

export const sharedApi = {
  list: (scope = 'mine') => get('/shared-bookshelves', { scope }),
  get: (id) => get(`/shared-bookshelves/${id}`),
  create: (body) => post('/shared-bookshelves', body),
  update: (id, body) => put(`/shared-bookshelves/${id}`, body),
  remove: (id) => del(`/shared-bookshelves/${id}`),
  join: (inviteCode) => post('/shared-bookshelves/join', { inviteCode }),
  leave: (id) => del(`/shared-bookshelves/${id}/leave`),
  regenerateCode: (id) => post(`/shared-bookshelves/${id}/invite-code`),
  removeMember: (id, userId) => del(`/shared-bookshelves/${id}/members/${userId}`),
  addItem: (id, readingRecordId) => post(`/shared-bookshelves/${id}/items`, { readingRecordId }),
  removeItem: (id, itemId) => del(`/shared-bookshelves/${id}/items/${itemId}`),
};

export const quoteApi = {
  list: (params) => get('/quotes', params),
  create: (body) => post('/quotes', body),
  update: (id, body) => put(`/quotes/${id}`, body),
  remove: (id) => del(`/quotes/${id}`),
};

export const socialApi = {
  follow: (userId) => post(`/users/${userId}/follow`),
  follows: (userId, type) => get(`/users/${userId}/follows`, { type }),
  feed: () => get('/feed'),
  badges: () => get('/badges'),
  badgesSeen: () => post('/badges/seen'),
};

export const timerApi = {
  get: () => get('/reading/timer'),
  start: (recordId) => post(`/reading/${recordId}/timer`),
  stop: (body) => post('/reading/timer/stop', body),
  cancel: () => del('/reading/timer'),
};

/** 다른 사이트 표지를 이미지 저장에 쓰기 위한 서버 프록시 주소 */
export const proxiedImage = (url) =>
  url && /^https?:\/\//i.test(url) ? `/api/image-proxy?url=${encodeURIComponent(url)}` : url;

export const bookSearchApi = {
  search: (q) => get('/book-search', { q }),
  pages: (isbn) => get('/book-search/pages', { isbn }),
};

export const miscApi = {
  dashboard: () => get('/dashboard'),
  search: (q, type = 'all') => get('/search', { q, type }),
  notifications: () => get('/notifications'),
  readNotifications: () => post('/notifications/read'),
  upload: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/uploads', fd).then((r) => r.data);
  },
};
