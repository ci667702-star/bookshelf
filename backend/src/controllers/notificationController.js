import { prisma } from '../utils/prisma.js';
import { publicUserSelect } from '../utils/serializers.js';

export async function listNotifications(req, res) {
  const userId = req.user.id;
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      include: {
        actor: { select: publicUserSelect },
        review: { select: { id: true, title: true } },
        sharedBookshelf: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  res.json({
    unreadCount,
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt,
      actor: n.actor,
      review: n.review,
      sharedBookshelf: n.sharedBookshelf,
    })),
  });
}

export async function markAllRead(req, res) {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json({ ok: true });
}
