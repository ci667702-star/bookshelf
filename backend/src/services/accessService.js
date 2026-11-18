import { prisma } from '../utils/prisma.js';
import { forbidden, notFound } from '../utils/httpError.js';
import { publicUserSelect } from '../utils/serializers.js';

// ───────── 개인 책장 ─────────

/** 공개 책장이거나 내 책장이면 반환. 비공개 책장은 존재 여부도 숨긴다(404). */
export async function getViewableShelf(shelfId, viewerId) {
  const shelf = await prisma.bookshelf.findUnique({
    where: { id: shelfId },
    include: { owner: { select: publicUserSelect } },
  });
  if (!shelf || (!shelf.isPublic && shelf.ownerId !== viewerId)) {
    throw notFound('비공개이거나 존재하지 않는 책장이에요.');
  }
  return shelf;
}

export async function getOwnedShelf(shelfId, userId) {
  const shelf = await prisma.bookshelf.findUnique({ where: { id: shelfId } });
  if (!shelf || (!shelf.isPublic && shelf.ownerId !== userId)) throw notFound('책장을 찾을 수 없어요.');
  if (shelf.ownerId !== userId) throw forbidden('내 책장만 수정할 수 있어요.');
  return shelf;
}

// ───────── 공유 책장 ─────────

export function getMembership(sharedId, userId) {
  if (!userId) return null;
  return prisma.sharedBookshelfMember.findUnique({
    where: { bookshelfId_userId: { bookshelfId: sharedId, userId } },
  });
}

/** 공개 공유 책장은 누구나, 비공개는 참여자만 */
export async function getViewableShared(sharedId, viewerId) {
  const shelf = await prisma.sharedBookshelf.findUnique({ where: { id: sharedId } });
  const membership = shelf ? await getMembership(sharedId, viewerId) : null;
  if (!shelf || (!shelf.isPublic && !membership)) {
    throw notFound('참여 중인 공유 책장만 볼 수 있어요.');
  }
  return { shelf, membership };
}

export async function requireSharedMember(sharedId, userId) {
  const { shelf, membership } = await getViewableShared(sharedId, userId);
  if (!membership) throw forbidden('공유 책장 참여자만 할 수 있어요.');
  return { shelf, membership };
}

export async function requireSharedOwner(sharedId, userId) {
  const { shelf, membership } = await requireSharedMember(sharedId, userId);
  if (shelf.ownerId !== userId) throw forbidden('공유 책장 소유자만 할 수 있어요.');
  return { shelf, membership };
}

// ───────── 독서 기록 / 책 ─────────

/** 내 기록이거나, 공개 책장에 있거나, 내가 볼 수 있는 공유 책장에 꽂힌 기록 */
export async function canViewRecord(record, viewerId) {
  if (viewerId && record.userId === viewerId) return true;
  if (record.bookshelfId) {
    const shelf = await prisma.bookshelf.findUnique({ where: { id: record.bookshelfId }, select: { isPublic: true } });
    if (shelf?.isPublic) return true;
  }
  const items = await prisma.sharedBookshelfItem.findMany({
    where: { readingRecordId: record.id },
    select: {
      bookshelf: {
        select: {
          isPublic: true,
          members: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
        },
      },
    },
  });
  return items.some((i) => i.bookshelf.isPublic || (i.bookshelf.members?.length ?? 0) > 0);
}

// ───────── 독후감 ─────────

/** 볼 수 있는 독후감 조건: 공개 / 내 글 / 내가 참여한 공유 책장의 글 */
export function reviewVisibleWhere(viewerId) {
  if (!viewerId) return { isPublic: true };
  return {
    OR: [
      { isPublic: true },
      { userId: viewerId },
      { sharedBookshelf: { members: { some: { userId: viewerId } } } },
    ],
  };
}

export async function getViewableReview(reviewId, viewerId, include) {
  const review = await prisma.review.findFirst({
    where: { AND: [{ id: reviewId }, reviewVisibleWhere(viewerId)] },
    include,
  });
  if (!review) throw notFound('비공개이거나 삭제된 독후감이에요.');
  return review;
}
