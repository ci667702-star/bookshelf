import { dateToKey } from './dates.js';

/** 다른 사용자에게 보여도 되는 최소 정보 */
export const publicUserSelect = { id: true, nickname: true, profileImage: true };

export function serializeMe(user) {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    profileImage: user.profileImage,
    bio: user.bio,
    yearlyGoalBooks: user.yearlyGoalBooks,
    monthlyGoalPages: user.monthlyGoalPages,
    createdAt: user.createdAt,
  };
}

export function serializeBook(book) {
  if (!book) return null;
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    coverImage: book.coverImage,
    totalPages: book.totalPages,
    createdById: book.createdById,
    createdAt: book.createdAt,
  };
}

export function serializeRecord(record) {
  if (!record) return null;
  return {
    id: record.id,
    userId: record.userId,
    bookshelfId: record.bookshelfId,
    bookId: record.bookId,
    status: record.status,
    currentPage: record.currentPage,
    rating: record.rating,
    oneLineReview: record.oneLineReview,
    startDate: dateToKey(record.startDate),
    finishDate: dateToKey(record.finishDate),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ...(record.book ? { book: serializeBook(record.book) } : {}),
    ...(record.user ? { user: record.user } : {}),
    ...(record.bookshelf !== undefined
      ? {
          bookshelf: record.bookshelf
            ? { id: record.bookshelf.id, name: record.bookshelf.name, isPublic: record.bookshelf.isPublic }
            : null,
        }
      : {}),
  };
}

export function serializeLog(log) {
  return {
    id: log.id,
    readingRecordId: log.readingRecordId,
    date: dateToKey(log.date),
    pagesRead: log.pagesRead,
    memo: log.memo,
    isAuto: log.isAuto,
    createdAt: log.createdAt,
  };
}

export function serializeReview(review, viewerId) {
  return {
    id: review.id,
    title: review.title,
    content: review.content,
    rating: review.rating,
    isPublic: review.isPublic,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user,
    book: review.book ? serializeBook(review.book) : undefined,
    sharedBookshelf: review.sharedBookshelf
      ? { id: review.sharedBookshelf.id, name: review.sharedBookshelf.name }
      : null,
    likeCount: review._count?.likes ?? 0,
    commentCount: review._count?.comments ?? 0,
    likedByMe: Array.isArray(review.likes) ? review.likes.length > 0 : false,
    isMine: viewerId ? review.userId === viewerId : false,
  };
}

/** 독후감 목록용 include (viewer 의 좋아요 여부 포함) */
export function reviewInclude(viewerId) {
  return {
    user: { select: publicUserSelect },
    book: true,
    sharedBookshelf: { select: { id: true, name: true } },
    _count: { select: { likes: true, comments: true } },
    likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
  };
}
