import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/jwt.js';
import { conflict, unauthorized, notFound } from '../utils/httpError.js';
import { serializeMe } from '../utils/serializers.js';
import { defaultDecoration } from '../services/decorationService.js';
import { booleanish } from '../utils/validators.js';

export const BCRYPT_ROUNDS = 12;
// 존재하지 않는 이메일에도 같은 시간이 걸리도록 비교용 더미 해시
const DUMMY_HASH = bcrypt.hashSync('bookmoment-timing-guard', BCRYPT_ROUNDS);

export const passwordRule = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 해요.')
  .max(64, '비밀번호는 64자 이하로 입력해 주세요.')
  .regex(/[A-Za-z]/, '비밀번호에 영문을 포함해 주세요.')
  .regex(/[0-9]/, '비밀번호에 숫자를 포함해 주세요.');

export const nicknameRule = z
  .string()
  .trim()
  .min(2, '닉네임은 2자 이상이어야 해요.')
  .max(20, '닉네임은 20자 이하로 입력해 주세요.')
  .regex(/^[가-힣a-zA-Z0-9_.\-]+$/, '닉네임은 한글, 영문, 숫자, _ . - 만 쓸 수 있어요.');

const emailRule = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .email('올바른 이메일 주소를 입력해 주세요.');

export const registerSchema = z
  .object({
    email: emailRule,
    password: passwordRule,
    passwordConfirm: z.string(),
    nickname: nicknameRule,
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: '비밀번호가 서로 달라요.',
    path: ['passwordConfirm'],
  });

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1, '비밀번호를 입력해 주세요.').max(64),
  remember: booleanish.optional().default(false),
});

export async function register(req, res) {
  const { email, password, nickname } = req.valid.body;

  const [emailTaken, nickTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.user.findUnique({ where: { nickname }, select: { id: true } }),
  ]);
  if (emailTaken) throw conflict('이미 가입된 이메일이에요.', { email: '이미 가입된 이메일이에요.' });
  if (nickTaken) throw conflict('이미 사용 중인 닉네임이에요.', { nickname: '이미 사용 중인 닉네임이에요.' });

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email, passwordHash, nickname, profileImage: req.file?.publicUrl ?? null },
    });
    // 가입과 동시에 첫 책장을 만들어 준다
    const shelf = await tx.bookshelf.create({
      data: {
        ownerId: created.id,
        name: `${nickname}의 첫 책장`,
        description: '오늘 읽은 한 페이지가 나만의 책장이 됩니다.',
        theme: 'cream',
      },
    });
    await tx.bookshelfDecoration.create({
      data: { userId: created.id, bookshelfId: shelf.id, ...defaultDecoration('cream') },
    });
    return created;
  });

  setAuthCookie(res, signToken(user, false), false);
  res.status(201).json({ user: serializeMe(user) });
}

export async function login(req, res) {
  const { email, password, remember } = req.valid.body;
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw unauthorized('이메일 또는 비밀번호가 올바르지 않아요.');

  setAuthCookie(res, signToken(user, remember), remember);
  res.json({ user: serializeMe(user) });
}

export async function logout(req, res) {
  clearAuthCookie(res);
  res.json({ ok: true });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw notFound('사용자를 찾을 수 없어요.');
  const unreadNotifications = await prisma.notification.count({ where: { userId: user.id, isRead: false } });
  res.json({ user: { ...serializeMe(user), unreadNotifications } });
}
