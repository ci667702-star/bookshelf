// 표지가 없는 책을 위한 결정적 색상 · 크기 (같은 책은 항상 같은 모습)

// 두 가지 잉크로 찍은 책 표지들 (남색 · 분홍 · 빨강 별색) + 파스텔 몇 가지
const COVER_PALETTES = [
  { bg: '#EFB3BB', fg: '#233E7C', band: '#233E7C' }, // 분홍 표지 · 남색 글자
  { bg: '#233E7C', fg: '#F5D8D8', band: '#EFB3BB' }, // 남색 표지 · 분홍 글자
  { bg: '#DCE8F2', fg: '#D23A2B', band: '#D23A2B' }, // 하늘색 종이 · 빨강 글자
  { bg: '#FFF9F2', fg: '#233E7C', band: '#E2412F' }, // 크림 종이 · 남색 글자 · 빨강 띠
  { bg: '#DDE8D7', fg: '#233E7C', band: '#7E9B72' },
  { bg: '#F8E8B8', fg: '#6B5420', band: '#D3A84C' },
  { bg: '#E6DDF0', fg: '#4F3F6E', band: '#9C86C4' },
  { bg: '#F5D8D8', fg: '#7C4A47', band: '#A47762' },
  { bg: '#A47762', fg: '#FFF9F2', band: '#F5D8D8' },
];

export function hashString(s = '') {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function coverPalette(key) {
  return COVER_PALETTES[hashString(key) % COVER_PALETTES.length];
}

/** 책 높이 비율 0.82 ~ 1 (책마다 자연스럽게 다르게) */
export function bookHeightRatio(key) {
  return 0.82 + ((hashString(`${key}h`) % 100) / 100) * 0.18;
}

/** 책등 두께: 페이지 수에 비례 (px) */
export function spineWidth(pages = 200) {
  return Math.round(Math.min(46, Math.max(18, 14 + pages / 18)));
}

/** -3 ~ 3도 사이의 기울기 */
export function tilt(key, range = 3) {
  return ((hashString(`${key}t`) % (range * 20 + 1)) / 10 - range).toFixed(1);
}
