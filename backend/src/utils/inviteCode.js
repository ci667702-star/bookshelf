import crypto from 'node:crypto';

// 헷갈리는 문자(0/O, 1/I/L) 제외
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

/** 암호학적으로 안전한 무작위 초대 코드 (31^8 ≈ 8.5e11 경우의 수) */
export function randomInviteCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH * 2);
  let code = '';
  for (let i = 0; code.length < CODE_LENGTH && i < bytes.length; i++) {
    const v = bytes[i];
    // modulo bias 방지: 248 = 31 * 8
    if (v < 248) code += ALPHABET[v % ALPHABET.length];
  }
  if (code.length < CODE_LENGTH) return randomInviteCode();
  return code;
}

/** DB 에 없는 코드가 나올 때까지 재시도 */
export async function generateUniqueInviteCode(prisma) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomInviteCode();
    const exists = await prisma.sharedBookshelf.findUnique({ where: { inviteCode: code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error('초대 코드를 생성하지 못했습니다.');
}

export function normalizeInviteCode(input) {
  return String(input || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}
