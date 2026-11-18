import { z } from 'zod';

export const THEMES = ['strawberry', 'cream', 'vintage', 'sky', 'forest', 'lavender'];
export const SHELF_STYLES = ['wood', 'white', 'pastel', 'scallop'];
export const ARRANGEMENTS = ['spine', 'cover', 'polaroid'];
export const STICKERS = ['flower', 'ribbon', 'star', 'heart', 'cat', 'book', 'coffee', 'cloud'];
export const ITEMS = ['plant', 'lamp', 'frame', 'candle', 'garland'];

export const THEME_DEFAULT_BG = {
  strawberry: '#FBE4E4',
  cream: '#FFF9F2',
  vintage: '#EFE2D0',
  sky: '#E3EEF7',
  forest: '#E4EDDF',
  lavender: '#EEE7F6',
};

export function defaultDecoration(theme = 'cream') {
  return {
    theme,
    background: { color: THEME_DEFAULT_BG[theme] ?? THEME_DEFAULT_BG.cream, image: null },
    decorations: [],
    layout: { shelfStyle: 'wood', arrangement: 'spine' },
  };
}

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, '색상은 #RRGGBB 형식이에요.');
const bgImage = z
  .union([
    z.string().regex(/^\/uploads\/[a-zA-Z0-9._-]+$/, '배경 이미지는 업로드한 파일만 쓸 수 있어요.'),
    z.string().regex(/^https:\/\/[^\s<>"'()]+$/i, '배경 이미지 주소가 올바르지 않아요.'),
    z.null(),
  ])
  .optional()
  .default(null);

const decorationItem = z
  .object({
    id: z.string().min(1).max(40),
    kind: z.enum(['sticker', 'item']),
    type: z.string(),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    rotate: z.number().min(-180).max(180).default(0),
    scale: z.number().min(0.4).max(3).default(1),
  })
  .refine((d) => (d.kind === 'sticker' ? STICKERS : ITEMS).includes(d.type), '알 수 없는 꾸미기 아이템이에요.');

export const decorationSchema = z.object({
  theme: z.enum(THEMES),
  background: z.object({ color: hexColor, image: bgImage }),
  decorations: z.array(decorationItem).max(40, '스티커와 장식은 40개까지 붙일 수 있어요.'),
  layout: z.object({
    shelfStyle: z.enum(SHELF_STYLES),
    arrangement: z.enum(ARRANGEMENTS),
  }),
});

export function serializeDecoration(deco, fallbackTheme) {
  if (!deco) return defaultDecoration(fallbackTheme);
  return {
    theme: deco.theme,
    background: deco.background,
    decorations: deco.decorations,
    layout: deco.layout,
    updatedAt: deco.updatedAt,
  };
}
