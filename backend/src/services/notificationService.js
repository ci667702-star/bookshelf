import { prisma } from '../utils/prisma.js';

/** 알림 생성 (자기 자신에게는 보내지 않음). 실패해도 본 요청은 성공시킨다. */
export async function notify({ userId, actorId, type, reviewId = null, sharedBookshelfId = null }) {
  if (!userId || userId === actorId) return;
  try {
    await prisma.notification.create({ data: { userId, actorId, type, reviewId, sharedBookshelfId } });
  } catch (err) {
    console.warn('[notify] failed', err.message);
  }
}

export async function removeLikeNotification({ userId, actorId, reviewId }) {
  await prisma.notification
    .deleteMany({ where: { userId, actorId, reviewId, type: 'LIKE', isRead: false } })
    .catch(() => {});
}
