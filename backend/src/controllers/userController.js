import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { conflict, notFound, unauthorized } from '../utils/httpError.js';
import { serializeMe, publicUserSelect } from '../utils/serializers.js';
import { optionalImage, optionalText } from '../utils/validators.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/jwt.js';
import { BCRYPT_ROUNDS, nicknameRule, passwordRule } from './authController.js';
import { summarizeRecords } from '../services/readingService.js';

export const updateMeSchema = z.object({
  nickname: nicknameRule.optional(),
  bio: optionalText(160),
  profileImage: optionalImage,
  yearlyGoalBooks: z.coerce.number().int().min(1, '1권 이상으로 정해 주세요.').max(365).optional(),
  monthlyGoalPages: z.coerce.number().int().min(10, '10쪽 이상으로 정해 주세요.').max(100000).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해 주세요.').max(64),
    newPassword: passwordRule,
    newPasswordConfirm: z.string(),
  })
  .refine((v) => v.newPassword === v.newPasswordConfirm, {
    message: '새 비밀번호가 서로 달라요.',
    path: ['newPasswordConfirm'],
  });

export const deleteMeSchema = z.object({ password: z.string().min(1, '비밀번호를 입력해 주세요.').max(64) });

export async function getProfile(req, res) {
  const { id } = req.valid.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { ...publicUserSelect, bio: true, createdAt: true },
  });
  if (!user) throw notFound('사용자를 찾을 수 없어요.');
  const isMe = req.user?.id === id;

  const shelves = await prisma.bookshelf.findMany({
    where: { ownerId: id, ...(isMe ? {} : { isPublic: true }) },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { records: true } },
      records: { take: 12, orderBy: { updatedAt: 'desc' }, include: { book: true } },
    },
  });
  // 통계는 공개된 책장 기준으로만 (비공개 독서량 노출 방지)
  const records = await prisma.readingRecord.findMany({
    where: { userId: id, ...(isMe ? {} : { bookshelf: { isPublic: true } }) },
    include: { book: { select: { totalPages: true } } },
  });
  const reviewCount = await prisma.review.count({ where: { userId: id, ...(isMe ? {} : { isPublic: true }) } });
  const [followerCount, followingCount, followRow] = await Promise.all([
    prisma.follow.count({ where: { followingId: id } }),
    prisma.follow.count({ where: { followerId: id } }),
    req.user && !isMe
      ? prisma.follow.findUnique({ where: { followerId_followingId: { followerId: req.user.id, followingId: id } } })
      : null,
  ]);

  res.json({
    user,
    isMe,
    isFollowing: !!followRow,
    followerCount,
    followingCount,
    stats: { ...summarizeRecords(records), reviews: reviewCount },
    shelves: shelves.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      coverImage: s.coverImage,
      isPublic: s.isPublic,
      theme: s.theme,
      bookCount: s._count.records,
      previewBooks: s.records.map((r) => ({ id: r.book.id, title: r.book.title, coverImage: r.book.coverImage })),
    })),
  });
}

export async function updateMe(req, res) {
  const data = { ...req.valid.body };
  if (req.file?.publicUrl) data.profileImage = req.file.publicUrl;
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  if (data.nickname) {
    const taken = await prisma.user.findFirst({
      where: { nickname: data.nickname, NOT: { id: req.user.id } },
      select: { id: true },
    });
    if (taken) throw conflict('이미 사용 중인 닉네임이에요.', { nickname: '이미 사용 중인 닉네임이에요.' });
  }
  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({ user: serializeMe(user) });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.valid.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw unauthorized('현재 비밀번호가 올바르지 않아요.');

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS), tokenVersion: { increment: 1 } },
  });
  // 다른 기기의 로그인은 끊고, 현재 기기는 새 토큰으로 유지
  setAuthCookie(res, signToken(updated, true), true);
  res.json({ ok: true });
}

export async function deleteMe(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const ok = await bcrypt.compare(req.valid.body.password, user.passwordHash);
  if (!ok) throw unauthorized('비밀번호가 올바르지 않아요.');
  await prisma.user.delete({ where: { id: user.id } });
  clearAuthCookie(res);
  res.json({ ok: true });
}
