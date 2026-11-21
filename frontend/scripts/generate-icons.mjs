// 앱 아이콘(PNG) 생성 — 외부 도구 없이 로고 도형을 직접 그려 PNG 로 저장
//   node frontend/scripts/generate-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/icons');
fs.mkdirSync(outDir, { recursive: true });

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const INK = hex('#233E7C'); // 남색 잉크
const PINK = hex('#EFB3BB'); // 분홍 잉크(바탕)

// 로고(64 단위 좌표, favicon.svg · LogoMark 와 같은 모양). stroke 는 바깥 잉크 + 안쪽 채움 두 겹으로 표현
const shapes = [
  { x: 13, y: 15, w: 11, h: 35, r: 1.5, fill: INK },
  { x: 13, y: 21, w: 11, h: 2.5, r: 0, fill: PINK },
  { x: 13, y: 42, w: 11, h: 2.5, r: 0, fill: PINK },
  { x: 26, y: 22, w: 9, h: 28, r: 1.5, fill: hex('#FFF9F2'), stroke: 2 },
  { x: 38, y: 12, w: 11, h: 38, r: 1.5, fill: INK, rot: (9 * Math.PI) / 180, cx: 43.5, cy: 31 },
  { x: 10, y: 50, w: 44, h: 3.5, r: 0, fill: INK },
];

function inRoundRect(px, py, x, y, w, h, r) {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const dx = Math.max(x + r - px, 0, px - (x + w - r));
  const dy = Math.max(y + r - py, 0, py - (y + h - r));
  return dx * dx + dy * dy <= r * r;
}

function colorAt(u, v, bg) {
  let c = bg;
  for (const s of shapes) {
    let pu = u;
    let pv = v;
    if (s.rot) {
      const cos = Math.cos(-s.rot);
      const sin = Math.sin(-s.rot);
      const du = u - s.cx;
      const dv = v - s.cy;
      pu = s.cx + du * cos - dv * sin;
      pv = s.cy + du * sin + dv * cos;
    }
    if (s.stroke) {
      const k = s.stroke / 2;
      if (inRoundRect(pu, pv, s.x - k, s.y - k, s.w + 2 * k, s.h + 2 * k, s.r + k)) c = INK;
      if (inRoundRect(pu, pv, s.x + k, s.y + k, s.w - 2 * k, s.h - 2 * k, Math.max(0, s.r - k))) c = s.fill;
    } else if (inRoundRect(pu, pv, s.x, s.y, s.w, s.h, s.r)) {
      c = s.fill;
    }
  }
  return c;
}

/** size px 정사각형, contentRatio: 로고가 차지할 비율 (maskable 은 안전 영역 때문에 작게) */
function render(size, contentRatio) {
  const bg = PINK;
  const k = (size * contentRatio) / 46; // 로고 폭 약 46 단위
  const SS = 4; // 4x4 슈퍼샘플링(안티앨리어싱)
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = 32 + (x + (sx + 0.5) / SS - size / 2) / k;
          const v = 33 + (y + (sy + 0.5) / SS - size / 2) / k;
          const c = colorAt(u, v, bg);
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const n = SS * SS;
      row.set([Math.round(r / n), Math.round(g / n), Math.round(b / n), 255], 1 + x * 4);
    }
    rows.push(row);
  }
  return encodePng(size, size, Buffer.concat(rows));
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePng(w, h, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const targets = [
  ['icon-192.png', 192, 0.78],
  ['icon-512.png', 512, 0.78],
  ['maskable-512.png', 512, 0.56],
  ['apple-touch-icon.png', 180, 0.72],
];
for (const [name, size, ratio] of targets) {
  fs.writeFileSync(path.join(outDir, name), render(size, ratio));
  console.log('✓', name);
}
