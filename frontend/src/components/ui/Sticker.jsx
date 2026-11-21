// 손으로 오린 듯한 스티커 & 장식 아이템 (모두 인라인 SVG — 팔레트 색만 사용)

const S = { stroke: '#233E7C', strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' };

const STICKERS = {
  flower: (
    <g {...S}>
      <circle cx="32" cy="17" r="10" fill="#F5D8D8" />
      <circle cx="46.3" cy="27.4" r="10" fill="#F5D8D8" />
      <circle cx="40.8" cy="44.1" r="10" fill="#F5D8D8" />
      <circle cx="23.2" cy="44.1" r="10" fill="#F5D8D8" />
      <circle cx="17.7" cy="27.4" r="10" fill="#F5D8D8" />
      <circle cx="32" cy="32" r="8" fill="#F8E3A0" />
    </g>
  ),
  ribbon: (
    <g {...S}>
      <path d="M29 33 L21 53 L27.5 50 L31 55 L32.5 35 Z" fill="#E8A9AE" />
      <path d="M35 33 L43 53 L36.5 50 L33 55 L31.5 35 Z" fill="#E8A9AE" />
      <path d="M32 30 C 24 17, 9 15, 8 26 C 7 37, 22 38, 32 32 Z" fill="#F3C3C6" />
      <path d="M32 30 C 40 17, 55 15, 56 26 C 57 37, 42 38, 32 32 Z" fill="#F3C3C6" />
      <rect x="27" y="25.5" width="10" height="11" rx="4" fill="#E8A9AE" />
    </g>
  ),
  star: (
    <g {...S}>
      <path
        d="M32 9 L38.47 24.1 L54.83 25.58 L42.46 36.4 L46.11 52.42 L32 44 L17.89 52.42 L21.54 36.4 L9.17 25.58 L25.53 24.1 Z"
        fill="#F8E3A0"
      />
      <circle cx="27.5" cy="34" r="1.6" fill="#233E7C" stroke="none" />
      <circle cx="36.5" cy="34" r="1.6" fill="#233E7C" stroke="none" />
      <path d="M30 38 q2 2 4 0" fill="none" strokeWidth="1.8" />
    </g>
  ),
  heart: (
    <g {...S}>
      <path
        d="M32 54 C 14 42, 6 30, 10 20 C 14 10, 27 9, 32 19 C 37 9, 50 10, 54 20 C 58 30, 50 42, 32 54 Z"
        fill="#EBA5A2"
      />
      <path d="M17 22 q2 -6 8 -6" fill="none" stroke="#fff" strokeWidth="3" />
    </g>
  ),
  cat: (
    <g {...S}>
      <path
        d="M14 27 L16 9 L27 19 Q32 17.5 37 19 L48 9 L50 27 Q54 35 50 43 Q44 53 32 53 Q20 53 14 43 Q10 35 14 27 Z"
        fill="#F2E8DC"
      />
      <path d="M18.5 15 L19.5 22 L24 19 Z" fill="#F5D8D8" stroke="none" />
      <path d="M45.5 15 L44.5 22 L40 19 Z" fill="#F5D8D8" stroke="none" />
      <circle cx="21" cy="40" r="3.2" fill="#F5D8D8" stroke="none" />
      <circle cx="43" cy="40" r="3.2" fill="#F5D8D8" stroke="none" />
      <circle cx="25" cy="33.5" r="2.6" fill="#233E7C" stroke="none" />
      <circle cx="39" cy="33.5" r="2.6" fill="#233E7C" stroke="none" />
      <path d="M30 38.5 L34 38.5 L32 41 Z" fill="#E59C99" strokeWidth="1.5" />
      <path d="M32 41 q-2 3 -5 2 M32 41 q2 3 5 2" fill="none" strokeWidth="1.8" />
      <path d="M7 36 L16 37 M8 42 L16 40 M57 36 L48 37 M56 42 L48 40" fill="none" strokeWidth="1.6" />
    </g>
  ),
  book: (
    <g {...S}>
      <path d="M5 19 L5 52 C 16 50, 26 51, 32 55 C 38 51, 48 50, 59 52 L59 19" fill="#C8DCBE" />
      <path d="M32 18 C 26 13, 16 12, 8 14 L8 48 C 16 46, 26 47, 32 52 Z" fill="#FFFFFF" />
      <path d="M32 18 C 38 13, 48 12, 56 14 L56 48 C 48 46, 38 47, 32 52 Z" fill="#FFFFFF" />
      <path d="M13 22 Q20 20.5 27 23 M13 28 Q20 26.5 27 29 M13 34 Q20 32.5 27 35 M37 23 Q44 20.5 51 22 M37 29 Q44 26.5 51 28" fill="none" strokeWidth="1.8" />
    </g>
  ),
  coffee: (
    <g {...S}>
      <path d="M24 6 q-4 5 0 9 q4 4 0 9 M35 4 q-4 5 0 9 q4 4 0 9" fill="none" strokeWidth="2.2" />
      <path d="M45 32 h4 a7.5 7.5 0 0 1 0 15 h-4" fill="none" strokeWidth="3" />
      <path d="M13 28 h33 v16 a10 10 0 0 1 -10 10 h-13 a10 10 0 0 1 -10 -10 Z" fill="#B88A73" />
      <ellipse cx="29.5" cy="28" rx="16.5" ry="3.6" fill="#7A5242" />
      <path d="M29.5 47 C 23 43, 22 39, 25 37.5 C 27 36.5, 29 37.5, 29.5 39 C 30 37.5, 32 36.5, 34 37.5 C 37 39, 36 43, 29.5 47 Z" fill="#F5D8D8" strokeWidth="1.6" />
    </g>
  ),
  cloud: (
    <g {...S}>
      <path d="M18 47 a10 10 0 0 1 -1 -20 a13 13 0 0 1 24 -6 a10 10 0 0 1 13 9 a8.5 8.5 0 0 1 -2 17 Z" fill="#D3E3F0" />
      <path d="M26 35 q2 -2 4 0 M38 35 q2 -2 4 0" fill="none" strokeWidth="2" />
      <circle cx="24" cy="40" r="2.4" fill="#F5D8D8" stroke="none" />
      <circle cx="44" cy="40" r="2.4" fill="#F5D8D8" stroke="none" />
    </g>
  ),
  // ── 배지로 여는 스티커 ──
  strawberry: (
    <g {...S}>
      <path d="M32 58 C 18 50, 9 37, 13 27 C 17 18, 47 18, 51 27 C 55 37, 46 50, 32 58 Z" fill="#EB8A86" />
      <path d="M19 23 L25 14 L29 20 L32 11 L35 20 L39 14 L45 23 Q 32 18 19 23 Z" fill="#9DBB8E" />
      {[
        [24, 31],
        [32, 29],
        [40, 31],
        [28, 39],
        [36, 39],
        [32, 47],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="1.4" ry="2" fill="#FFF3C4" stroke="none" />
      ))}
    </g>
  ),
  letter: (
    <g {...S}>
      <rect x="8" y="16" width="48" height="34" rx="4" fill="#FFF9F2" />
      <path d="M9 19 L32 37 L55 19" fill="none" />
      <path d="M32 44 C 26 40, 25 36, 28 34.5 C 30 33.5, 31.5 34.5, 32 36 C 32.5 34.5, 34 33.5, 36 34.5 C 39 36, 38 40, 32 44 Z" fill="#EBA5A2" strokeWidth="1.8" />
    </g>
  ),
  clover: (
    <g {...S}>
      <path d="M32 40 q 4 10 12 17" fill="none" strokeWidth="3" />
      <circle cx="24" cy="24" r="10" fill="#B7D6A3" />
      <circle cx="40" cy="24" r="10" fill="#B7D6A3" />
      <circle cx="24" cy="40" r="10" fill="#B7D6A3" />
      <circle cx="40" cy="40" r="10" fill="#B7D6A3" />
      <circle cx="32" cy="32" r="4" fill="#9DBB8E" />
    </g>
  ),
  rainbow: (
    <g {...S}>
      <path d="M7 46 A25 25 0 0 1 57 46 L49 46 A17 17 0 0 0 15 46 Z" fill="#F3B6B6" />
      <path d="M15 46 A17 17 0 0 1 49 46 L42 46 A10 10 0 0 0 22 46 Z" fill="#F8E3A0" />
      <path d="M22 46 A10 10 0 0 1 42 46 L36 46 A4 4 0 0 0 28 46 Z" fill="#B7D6A3" />
      <circle cx="10" cy="48" r="5" fill="#fff" />
      <circle cx="54" cy="48" r="5" fill="#fff" />
    </g>
  ),
  moon: (
    <g {...S}>
      <path d="M40 9 A23 23 0 1 0 55 44 A18 18 0 1 1 40 9 Z" fill="#F8E3A0" />
      <path d="M48 14 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 Z" fill="#fff" strokeWidth="1.5" />
      <circle cx="24" cy="34" r="1.6" fill="#233E7C" stroke="none" />
      <path d="M27 40 q 3 2 6 0" fill="none" strokeWidth="1.8" />
    </g>
  ),
  crown: (
    <g {...S}>
      <path d="M10 46 L13 20 L24 32 L32 14 L40 32 L51 20 L54 46 Z" fill="#F8D27A" />
      <rect x="10" y="45" width="44" height="9" rx="2.5" fill="#F2C94C" />
      <circle cx="13" cy="18" r="3" fill="#EBA5A2" />
      <circle cx="32" cy="12" r="3" fill="#EBA5A2" />
      <circle cx="51" cy="18" r="3" fill="#EBA5A2" />
      <circle cx="32" cy="38" r="3.2" fill="#A9C7E3" strokeWidth="2" />
    </g>
  ),
};

const ITEMS = {
  plant: (
    <g {...S}>
      <path d="M32 34 C 22 30, 12 21, 15 10 C 26 11, 33 21, 32 34 Z" fill="#9DBB8E" />
      <path d="M32 34 C 42 29, 52 19, 49 8 C 38 10, 31 21, 32 34 Z" fill="#B7CFA9" />
      <path d="M32 34 C 27 24, 28 12, 32 4 C 36 12, 37 24, 32 34 Z" fill="#7E9B72" />
      <path d="M18 36 h28 l-3 21 a4 4 0 0 1 -4 3.5 h-14 a4 4 0 0 1 -4 -3.5 Z" fill="#D88C6E" />
      <rect x="15" y="32" width="34" height="7" rx="2.5" fill="#E8A587" />
    </g>
  ),
  lamp: (
    <g {...S}>
      <path d="M29 31 C 29 40, 27 48, 22 54 h20 C 37 48, 35 40, 35 31 Z" fill="#A9C7E3" />
      <ellipse cx="32" cy="55" rx="13" ry="3.5" fill="#8FB3D6" />
      <path d="M9 31 C 9 13, 55 13, 55 31 Q 32 35 9 31 Z" fill="#A9C7E3" />
      <path d="M13 31.5 Q 32 34.5 51 31.5" fill="none" stroke="#F8E3A0" strokeWidth="3" />
      <path d="M17 23 q6 -7 15 -7" fill="none" stroke="#fff" strokeWidth="2.6" />
    </g>
  ),
  frame: (
    <g {...S}>
      <path d="M22 11 L32 3 L42 11" fill="none" strokeWidth="2" />
      <rect x="8" y="11" width="48" height="44" rx="4" fill="#C9A27E" />
      <rect x="15" y="18" width="34" height="30" rx="2" fill="#DCE8F2" strokeWidth="2" />
      <path d="M15 41 Q 24 31 32 39 Q 40 33 49 41 V48 H15 Z" fill="#B7CFA9" strokeWidth="2" />
      <circle cx="40" cy="26" r="4" fill="#F8E3A0" strokeWidth="2" />
    </g>
  ),
  candle: (
    <g {...S}>
      <path d="M32 7 C 37.5 13, 37.5 19.5, 32 22 C 26.5 19.5, 26.5 13, 32 7 Z" fill="#F8D27A" />
      <path d="M32 22 v4" />
      <rect x="18" y="26" width="28" height="31" rx="6" fill="#F5D8D8" />
      <rect x="22" y="36" width="20" height="11" rx="2" fill="#FFF9F2" strokeWidth="2" />
      <path d="M26 41.5 h12" strokeWidth="1.6" />
    </g>
  ),
};

const GARLAND_COLORS = ['#F5D8D8', '#DDE8D7', '#F8E3A0', '#D3E3F0', '#E6DDF0', '#F5D8D8'];
const GARLAND_FLAGS = [
  [20, 11.4],
  [50, 16],
  [80, 18.5],
  [110, 18.9],
  [140, 17.1],
  [170, 13.1],
];

function Garland() {
  return (
    <g {...S}>
      <path d="M4 8 Q 100 30 196 8" fill="none" strokeWidth="2" />
      {GARLAND_FLAGS.map(([x, y], i) => (
        <path key={x} d={`M${x - 11} ${y - 1} L${x + 11} ${y + 1} L${x} ${y + 24} Z`} fill={GARLAND_COLORS[i]} strokeWidth="2.2" />
      ))}
    </g>
  );
}

const DIECUT =
  'drop-shadow(1.6px 0 0 #fff) drop-shadow(-1.6px 0 0 #fff) drop-shadow(0 1.6px 0 #fff) drop-shadow(0 -1.6px 0 #fff) drop-shadow(0 3px 3px rgba(35,62,124,0.22))';

export default function Sticker({ kind = 'sticker', type, className = 'h-14 w-14', title, diecut = true }) {
  const isGarland = kind === 'item' && type === 'garland';
  const content = isGarland ? <Garland /> : (kind === 'item' ? ITEMS : STICKERS)[type];
  if (!content) return null;
  return (
    <svg
      viewBox={isGarland ? '0 0 200 48' : '0 0 64 64'}
      className={className}
      style={{ filter: diecut ? DIECUT : undefined, overflow: 'visible' }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {content}
    </svg>
  );
}
