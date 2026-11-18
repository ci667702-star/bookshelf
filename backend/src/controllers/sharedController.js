import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/httpError.js';
import { publicUserSelect, reviewInclude, serializeRecord, serializeReview } from '../utils/serializers.js';
import { booleanish, optionalImage, optionalText } from '../utils/validators.js';
import { generateUniqueInviteCode, normalizeInviteCode } from '../utils/inviteCode.js';
import {
  getViewableShared,
  requireSharedMember,
  requireSharedOwner,
  reviewVisibleWhere,
} from '../services/accessService.js';
import { summarizeRecords } from '../services/readingService.js';
import { notify } from '../services/notificationService.js';

const sharedBody = {
  name: z.string().trim().min(1, '책장 이름을 입력해 주세요.').max(40, '책장 이름은 40자 이하예요.'),
  description: optionalText(300),
  coverImage: optionalImage,
  isPublic: booleanish.optional(),
};

export const createSharedSchema = z.object(sharedBody);
export const updateSharedSchema = z.object(sharedBody).partial();
export const joinSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(1, '초대 코드를 입력해 주세요.')
    .max(20)
    .transform(normalizeInviteCode)
    .refine((v) => v.length === 8, '초대 코드는 8자리예요.'),
});
export const listSharedQuery = z.object({ scope: z.enum(['mine', 'public']).default('mine') });
export const addItemSchema = z.object({ readingRecordId: z.string().min(1, '책을 골라 주세요.').max(40) });
export const memberParams = z.object({ id: z.string().min(1).max(40), userId: z.string().min(1).max(40) });
export const itemParams = z.object({ id: z.string().min(1).max(40), itemId: z.string().min(1).max(40) });

function summary(s, viewerId) {
  const isMember = s.members?.some((m) => m.userId === viewerId) ?? false;
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    coverImage: s.coverImage,
    isPublic: s.isPublic,
    createdAt: s.createdAt,
    owner: s.owner,
    memberCount: s._count?.members ?? 0,
    bookCount: s._count?.items ?? 0,
    isOwner: s.ownerId === viewerId,
    isMember,
    previewMembers: (s.members ?? []).slice(0, 5).map((m) => m.user),
    previewBooks: (s.items ?? []).map((i) => ({
      id: i.record.book.id,
      title: i.record.book.title,
      coverImage: i.record.book.coverImage,
    })),
  };
}

const summaryInclude = {
  owner: { select: publicUserSelect },
  _count: { select: { members: true, items: true } },
  members: { orderBy: { joinedAt: 'asc' }, include: { user: { select: publicUserSelect } } },
  items: { take: 5, orderBy: { createdAt: 'desc' }, include: { record: { include: { book: true } } } },
};

export async function listShared(req, res) {
  const viewerId = req.user.id;
  const where =
    req.valid.query.scope === 'mine'
      ? { members: { some: { userId: viewerId } } }
      : { isPublic: true, NOT: { members: { some: { userId: viewerId } } } };
  const shelves = await prisma.sharedBookshelf.findMany({
    where,
    include: summaryInclude,
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
  res.json({ items: shelves.map((s) => summary(s, viewerId)) });
}

export async function createShared(req, res) {
  const data = req.valid.body;
  const owned = await prisma.sharedBookshelf.count({ where: { ownerId: req.user.id } });
  if (owned >= 20) throw badRequest('공유 책장은 20개까지 만들 수 있어요.');
  const inviteCode = await generateUniqueInviteCode(prisma);
  const shelf = await prisma.sharedBookshelf.create({
    data: {
      ...data,
      isPublic: data.isPublic ?? false,
      ownerId: req.user.id,
      inviteCode,
      members: { create: { userId: req.user.id, role: 'OWNER' } },
    },
    include: summaryInclude,
  });
  res.status(201).json({ shelf: { ...summary(shelf, req.user.id), inviteCode } });
}

export async function getShared(req, res) {
  const viewerId = req.user.id;
  const { shelf, membership } = await getViewableShared(req.valid.params.id, viewerId);
  const isMember = !!membership;

  const [owner, members, items, reviews] = await Promise.all([
    prisma.user.findUnique({ where: { id: shelf.ownerId }, select: publicUserSelect }),
    prisma.sharedBookshelfMember.findMany({
      where: { bookshelfId: shelf.id },
      include: { user: { select: publicUserSelect } },
      orderBy: { joinedAt: 'asc' },
    }),
    prisma.sharedBookshelfItem.findMany({
      where: { bookshelfId: shelf.id },
      include: {
        addedBy: { select: publicUserSelect },
        record: { include: { book: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.review.findMany({
      where: { AND: [{ sharedBookshelfId: shelf.id }, reviewVisibleWhere(viewerId)] },
      include: reviewInclude(viewerId),
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);

  // 참여자별 통계 (각자 이 책장에 꽂은 책 기준)
  const memberStats = members.map((m) => {
    const records = items.filter((i) => i.addedById === m.userId).map((i) => i.record);
    return {
      user: m.user,
      role: m.role,
      joinedAt: m.joinedAt,
      stats: summarizeRecords(records),
    };
  });

  res.json({
    shelf: {
      id: shelf.id,
      name: shelf.name,
      description: shelf.description,
      coverImage: shelf.coverImage,
      isPublic: shelf.isPublic,
      createdAt: shelf.createdAt,
      owner,
      // 초대 코드는 참여자에게만 보여준다
      inviteCode: isMember ? shelf.inviteCode : undefined,
    },
    isMember,
    isOwner: shelf.ownerId === viewerId,
    myRole: membership?.role ?? null,
    stats: summarizeRecords(items.map((i) => i.record)),
    members: memberStats,
    items: items.map((i) => ({
      id: i.id,
      createdAt: i.createdAt,
      addedBy: i.addedBy,
      canRemove: i.addedById === viewerId || shelf.ownerId === viewerId,
      record: serializeRecord(i.record),
    })),
    reviews: reviews.map((r) => serializeReview(r, viewerId)),
  });
}

export async function updateShared(req, res) {
  const { shelf } = await requireSharedOwner(req.valid.params.id, req.user.id);
  const data = { ...req.valid.body };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  const updated = await prisma.sharedBookshelf.update({ where: { id: shelf.id }, data, include: summaryInclude });
  res.json({ shelf: summary(updated, req.user.id) });
}

export async function deleteShared(req, res) {
  const { shelf } = await requireSharedOwner(req.valid.params.id, req.user.id);
  await prisma.sharedBookshelf.delete({ where: { id: shelf.id } });
  res.json({ ok: true });
}

export async function regenerateCode(req, res) {
  const { shelf } = await requireSharedOwner(req.valid.params.id, req.user.id);
  const inviteCode = await generateUniqueInviteCode(prisma);
  await prisma.sharedBookshelf.update({ where: { id: shelf.id }, data: { inviteCode } });
  res.json({ inviteCode });
}

/** 초대 코드로 참여 */
export async function joinShared(req, res) {
  const { inviteCode } = req.valid.body;
  const shelf = await prisma.sharedBookshelf.findUnique({ where: { inviteCode } });
  if (!shelf) {
    throw notFound('유효하지 않은 초대 코드예요. 코드를 다시 확인해 주세요.');
  }
  const existing = await prisma.sharedBookshelfMember.findUnique({
    where: { bookshelfId_userId: { bookshelfId: shelf.id, userId: req.user.id } },
  });
  if (existing) throw conflict('이미 참여 중인 공유 책장이에요.', { sharedBookshelfId: shelf.id });

  const count = await prisma.sharedBookshelfMember.count({ where: { bookshelfId: shelf.id } });
  if (count >= 50) throw badRequest('참여 인원이 가득 찼어요. (최대 50명)');

  await prisma.sharedBookshelfMember.create({ data: { bookshelfId: shelf.id, userId: req.user.id, role: 'MEMBER' } });
  await notify({ userId: shelf.ownerId, actorId: req.user.id, type: 'JOIN', sharedBookshelfId: shelf.id });
  res.status(201).json({ shelf: { id: shelf.id, name: shelf.name } });
}

/** 참여자가 빠질 때: 그 사람이 꽂은 책은 빼고, 공유 독후감 연결도 해제 */
async function removeMemberData(tx, sharedId, userId) {
  await tx.sharedBookshelfItem.deleteMany({ where: { bookshelfId: sharedId, addedById: userId } });
  await tx.review.updateMany({
    where: { sharedBookshelfId: sharedId, userId },
    data: { sharedBookshelfId: null },
  });
  await tx.sharedBookshelfMember.delete({ where: { bookshelfId_userId: { bookshelfId: sharedId, userId } } });
}

export async function leaveShared(req, res) {
  const { shelf } = await requireSharedMember(req.valid.params.id, req.user.id);
  if (shelf.ownerId === req.user.id) {
    throw badRequest('소유자는 나갈 수 없어요. 더 이상 쓰지 않는다면 책장을 삭제해 주세요.');
  }
  await prisma.$transaction((tx) => removeMemberData(tx, shelf.id, req.user.id));
  res.json({ ok: true });
}

export async function removeMember(req, res) {
  const { id, userId } = req.valid.params;
  const { shelf } = await requireSharedOwner(id, req.user.id);
  if (userId === shelf.ownerId) throw badRequest('소유자는 내보낼 수 없어요.');
  const member = await prisma.sharedBookshelfMember.findUnique({
    where: { bookshelfId_userId: { bookshelfId: shelf.id, userId } },
  });
  if (!member) throw notFound('참여자를 찾을 수 없어요.');
  await prisma.$transaction((tx) => removeMemberData(tx, shelf.id, userId));
  res.json({ ok: true });
}

/** 내 독서 기록을 공유 책장에 꽂기 */
export async function addItem(req, res) {
  const { shelf } = await requireSharedMember(req.valid.params.id, req.user.id);
  const record = await prisma.readingRecord.findUnique({ where: { id: req.valid.body.readingRecordId } });
  if (!record || record.userId !== req.user.id) throw forbidden('내 책만 공유 책장에 꽂을 수 있어요.');

  const dup = await prisma.sharedBookshelfItem.findUnique({
    where: { bookshelfId_readingRecordId: { bookshelfId: shelf.id, readingRecordId: record.id } },
  });
  if (dup) throw conflict('이미 이 공유 책장에 꽂은 책이에요.');

  const item = await prisma.sharedBookshelfItem.create({
    data: { bookshelfId: shelf.id, readingRecordId: record.id, addedById: req.user.id },
    include: { addedBy: { select: publicUserSelect }, record: { include: { book: true } } },
  });
  await prisma.sharedBookshelf.update({ where: { id: shelf.id }, data: { updatedAt: new Date() } });
  res.status(201).json({
    item: { id: item.id, createdAt: item.createdAt, addedBy: item.addedBy, canRemove: true, record: serializeRecord(item.record) },
  });
}

/** 공유 책장에서 빼기: 등록한 본인 또는 소유자 (책 자체는 삭제되지 않음) */
export async function removeItem(req, res) {
  const { id, itemId } = req.valid.params;
  const { shelf } = await requireSharedMember(id, req.user.id);
  const item = await prisma.sharedBookshelfItem.findUnique({ where: { id: itemId } });
  if (!item || item.bookshelfId !== shelf.id) throw notFound('책을 찾을 수 없어요.');
  if (item.addedById !== req.user.id && shelf.ownerId !== req.user.id) {
    throw forbidden('내가 꽂은 책만 뺄 수 있어요.');
  }
  await prisma.sharedBookshelfItem.delete({ where: { id: item.id } });
  res.json({ ok: true });
}
