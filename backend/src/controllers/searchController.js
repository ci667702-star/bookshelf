import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { publicUserSelect, reviewInclude, serializeRecord, serializeReview } from '../utils/serializers.js';

export const searchQuery = z.object({
  q: z.string().trim().min(1, '검색어를 입력해 주세요.').max(100),
  type: z.enum(['all', 'books', 'users', 'shelves', 'reviews']).default('all'),
});

const contains = (q) => ({ contains: q, mode: 'insensitive' });

/** 책 / 작가 / 사용자 / 공개 책장 / 공개 독후감 통합 검색 (볼 수 있는 것만) */
export async function search(req, res) {
  const { q, type } = req.valid.query;
  const viewerId = req.user?.id;
  const take = type === 'all' ? 8 : 30;
  const want = (t) => type === 'all' || type === t;

  const [books, users, shelves, sharedShelves, reviews] = await Promise.all([
    want('books')
      ? prisma.readingRecord.findMany({
          where: {
            AND: [
              { book: { OR: [{ title: contains(q) }, { author: contains(q) }] } },
              { OR: [{ bookshelf: { isPublic: true } }, ...(viewerId ? [{ userId: viewerId }] : [])] },
            ],
          },
          include: { book: true, user: { select: publicUserSelect } },
          orderBy: { createdAt: 'desc' },
          take,
        })
      : [],
    want('users')
      ? prisma.user.findMany({
          where: { nickname: contains(q) },
          select: { ...publicUserSelect, bio: true },
          take,
        })
      : [],
    want('shelves')
      ? prisma.bookshelf.findMany({
          where: {
            isPublic: true,
            OR: [{ name: contains(q) }, { description: contains(q) }],
          },
          include: { owner: { select: publicUserSelect }, _count: { select: { records: true } } },
          take,
        })
      : [],
    want('shelves')
      ? prisma.sharedBookshelf.findMany({
          where: { isPublic: true, OR: [{ name: contains(q) }, { description: contains(q) }] },
          include: { owner: { select: publicUserSelect }, _count: { select: { members: true, items: true } } },
          take,
        })
      : [],
    want('reviews')
      ? prisma.review.findMany({
          where: {
            isPublic: true,
            OR: [{ title: contains(q) }, { content: contains(q) }, { book: { title: contains(q) } }],
          },
          include: reviewInclude(viewerId),
          orderBy: { createdAt: 'desc' },
          take,
        })
      : [],
  ]);

  res.json({
    q,
    books: books.map((r) => ({ ...serializeRecord(r), isMine: r.userId === viewerId })),
    users,
    shelves: shelves.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      theme: s.theme,
      owner: s.owner,
      bookCount: s._count.records,
    })),
    sharedShelves: sharedShelves.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      owner: s.owner,
      memberCount: s._count.members,
      bookCount: s._count.items,
    })),
    reviews: reviews.map((r) => serializeReview(r, viewerId)),
  });
}
