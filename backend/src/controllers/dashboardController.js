import { prisma } from '../utils/prisma.js';
import { publicUserSelect, reviewInclude, serializeRecord, serializeReview } from '../utils/serializers.js';
import { getCalendar, getMarathon } from '../services/readingService.js';
import { currentYearMonth, todayKey } from '../utils/dates.js';

export async function dashboard(req, res) {
  const userId = req.user.id;
  const { year, month } = currentYearMonth();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    user,
    marathon,
    calendar,
    recentBooks,
    reading,
    myReviews,
    shelves,
    sharedShelves,
    publicShelves,
    popularReviews,
    recentShared,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { ...publicUserSelect, bio: true } }),
    getMarathon(userId),
    getCalendar(userId, year, month),
    prisma.readingRecord.findMany({
      where: { userId },
      include: { book: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.readingRecord.findMany({
      where: { userId, status: 'READING' },
      include: { book: true },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    }),
    prisma.review.findMany({
      where: { userId },
      include: reviewInclude(userId),
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.bookshelf.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { records: true } },
        records: { take: 8, orderBy: { createdAt: 'desc' }, include: { book: true } },
      },
    }),
    prisma.sharedBookshelf.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { members: true, items: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 4,
    }),
    // 추천: 다른 사람들의 공개 책장
    prisma.bookshelf.findMany({
      where: { isPublic: true, NOT: { ownerId: userId }, records: { some: {} } },
      include: {
        owner: { select: publicUserSelect },
        _count: { select: { records: true } },
        records: { take: 4, orderBy: { createdAt: 'desc' }, include: { book: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 4,
    }),
    // 추천: 최근 30일 인기 독후감 (공개)
    prisma.review.findMany({
      where: { isPublic: true, createdAt: { gte: monthAgo } },
      include: reviewInclude(userId),
      orderBy: [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }],
      take: 4,
    }),
    // 추천: 공개 책장에 최근 꽂힌 다른 사람의 책
    prisma.readingRecord.findMany({
      where: { bookshelf: { isPublic: true }, NOT: { userId } },
      include: { book: true, user: { select: publicUserSelect } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ]);

  res.json({
    today: todayKey(),
    user,
    stats: {
      finishedCount: marathon.finishedCount,
      totalPages: marathon.totalPages,
      heightCm: marathon.heightCm,
      monthPages: marathon.monthPages,
      readingCount: marathon.readingCount,
    },
    marathon,
    calendar: { year: calendar.year, month: calendar.month, today: calendar.today, days: calendar.days, stats: calendar.stats },
    recentBooks: recentBooks.map(serializeRecord),
    currentlyReading: reading.map(serializeRecord),
    recentReviews: myReviews.map((r) => serializeReview(r, userId)),
    shelves: shelves.map((s) => ({
      id: s.id,
      name: s.name,
      isPublic: s.isPublic,
      theme: s.theme,
      bookCount: s._count.records,
      previewBooks: s.records.map((r) => ({
        id: r.book.id,
        title: r.book.title,
        author: r.book.author,
        coverImage: r.book.coverImage,
        totalPages: r.book.totalPages,
      })),
    })),
    sharedShelves: sharedShelves.map((s) => ({
      id: s.id,
      name: s.name,
      coverImage: s.coverImage,
      isPublic: s.isPublic,
      memberCount: s._count.members,
      bookCount: s._count.items,
      isOwner: s.ownerId === userId,
    })),
    recommendations: {
      publicShelves: publicShelves.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        theme: s.theme,
        owner: s.owner,
        bookCount: s._count.records,
        previewBooks: s.records.map((r) => ({
          id: r.book.id,
          title: r.book.title,
          coverImage: r.book.coverImage,
          totalPages: r.book.totalPages,
        })),
      })),
      popularReviews: popularReviews.map((r) => serializeReview(r, userId)),
      recentSharedBooks: recentShared.map(serializeRecord),
    },
  });
}
