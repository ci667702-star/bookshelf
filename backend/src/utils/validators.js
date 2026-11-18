import { z } from 'zod';

// 공통 Zod 조각

export const idParam = z.object({ id: z.string().min(1).max(40) });

/** 이미지 주소: 업로드한 파일(/uploads/...) 또는 http(s) URL 만 허용 (javascript: 등 차단) */
export const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => /^\/uploads\/[a-zA-Z0-9._-]+$/.test(v) || /^https?:\/\/[^\s<>"']+$/i.test(v),
    '이미지 주소 형식이 올바르지 않아요.'
  );

export const optionalImage = z
  .union([imageUrl, z.literal(''), z.null()])
  .optional()
  .transform((v) => (v === '' ? null : v));

export const optionalText = (max) =>
  z
    .union([z.string().trim().max(max, `${max}자 이하로 입력해 주세요.`), z.null()])
    .optional()
    .transform((v) => (v === '' ? null : v));

/** 'YYYY-MM-DD' */
export const dateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD 입니다.')
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), '올바른 날짜가 아니에요.');

export const optionalDate = z
  .union([dateKey, z.literal(''), z.null()])
  .optional()
  .transform((v) => (v === '' ? null : v));

export const rating = z.union([z.coerce.number().int().min(1).max(5), z.null()]).optional();

export const booleanish = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((v) => v === true || v === 'true');

export const readingStatus = z.enum(['WANT_TO_READ', 'READING', 'FINISHED', 'STOPPED']);

export const pagination = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(40).optional(),
});
