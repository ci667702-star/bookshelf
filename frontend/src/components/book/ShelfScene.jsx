import { useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import BookCover from './BookCover.jsx';
import Sticker from '../ui/Sticker.jsx';
import { THEMES } from '../../utils/constants.js';
import { bookHeightRatio, coverPalette, hashString, spineWidth, tilt } from '../../utils/color.js';
import { useElementWidth } from '../../hooks/index.js';
import { progressPct } from '../../utils/format.js';

// 평면(2D) 일러스트 책장: 그라데이션 · 입체 그림자 없이 단색 + 잉크 외곽선

const INK = '#233E7C';
const LINE = `2px solid ${INK}`;

// ───────── 벽 배경 ─────────
const PATTERNS = {
  none: 'none',
  dots: 'radial-gradient(rgba(255,255,255,0.8) 2px, transparent 2.6px)',
  stripes: 'repeating-linear-gradient(90deg, rgba(126,82,61,0.07) 0 18px, transparent 18px 36px)',
  clouds: 'radial-gradient(ellipse 30px 13px at 30% 40%, #fff 98%, transparent), radial-gradient(ellipse 20px 11px at 42% 32%, #fff 98%, transparent)',
  leaves: 'radial-gradient(rgba(95,122,85,0.18) 2.4px, transparent 3px)',
};
const PATTERN_SIZE = { dots: '22px 22px', stripes: 'auto', clouds: '220px 140px', leaves: '28px 28px', none: 'auto' };

export function sceneBackground(decoration) {
  const theme = THEMES[decoration?.theme] ?? THEMES.cream;
  const color = decoration?.background?.color || theme.bg;
  const image = decoration?.background?.image;
  if (image) return { backgroundColor: color, backgroundImage: `url("${image}")`, backgroundSize: 'cover', backgroundPosition: 'center' };
  return { backgroundColor: color, backgroundImage: PATTERNS[theme.pattern], backgroundSize: PATTERN_SIZE[theme.pattern] };
}

function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.round((255 - v) * amt + v);
  return `rgb(${ch(n >> 16)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`;
}

function cabinetFor(style, theme, themeKey) {
  if (style === 'white') return { frame: '#FFFFFF', back: '#F7EFE6', accent: theme.accent };
  if (style === 'pastel' || style === 'scallop') {
    return { frame: theme.plank, back: lighten(theme.bg, 0.45), accent: theme.accent, lace: style === 'scallop' };
  }
  if (themeKey === 'vintage') return { frame: '#C48E69', back: '#A9785A', accent: '#F5D8D8', dark: true };
  return { frame: '#EBC79F', back: '#FBEBD6', accent: theme.accent };
}

// ───────── 책 ─────────

function BookLink({ book, linkBooks, className = '', style, children }) {
  const label = `${book.title} — ${book.author ?? ''}`;
  if (linkBooks && book.id) {
    return (
      <Link to={`/books/${book.id}`} aria-label={label} title={label} className={`relative block shrink-0 ${className}`} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <div title={label} className={`relative shrink-0 ${className}`} style={style}>
      {children}
    </div>
  );
}

/** 납작한 책등 */
export function Spine({ record, height, width, compact }) {
  const b = record.book;
  const pal = coverPalette(b.id || b.title);
  const variant = hashString(`${b.id || b.title}v`) % 3;
  const fs = Math.max(compact ? 7.5 : 9, Math.min(compact ? 10 : 12, width * 0.42));
  return (
    <div
      className="relative flex flex-col items-center overflow-hidden"
      style={{
        height,
        width,
        background: pal.bg,
        color: pal.fg,
        border: compact ? `1.5px solid ${INK}` : LINE,
        borderRadius: '4px 4px 2px 2px',
        opacity: record.status === 'WANT_TO_READ' ? 0.85 : 1,
      }}
    >
      {variant === 2 && <span aria-hidden className="w-full shrink-0" style={{ height: '14%', background: pal.band, borderBottom: `1.5px solid ${INK}` }} />}
      {variant === 0 && <span aria-hidden className="mt-[10%] block w-full shrink-0" style={{ height: 3, background: pal.band }} />}
      <span
        className={`mt-[10%] line-clamp-1 font-serif leading-none font-extrabold tracking-[-0.02em] [writing-mode:vertical-rl] ${
          variant === 1 ? 'rounded-[2px] bg-[#FFF9F2] px-[1px] py-1 text-ink' : ''
        }`}
        style={{ fontSize: fs, maxHeight: height * 0.66, border: variant === 1 ? `1.5px solid ${INK}` : undefined }}
      >
        {b.title}
      </span>
      {variant !== 1 && <span aria-hidden className="mt-auto mb-[12%] block w-full shrink-0" style={{ height: 3, background: pal.band }} />}
      {variant === 1 && !compact && width >= 22 && (
        <span aria-hidden className="mt-auto mb-[10%] text-[9px] leading-none" style={{ color: pal.band }}>
          ♥
        </span>
      )}
    </div>
  );
}

function Bookmark({ record }) {
  if (record?.status !== 'READING') return null;
  return (
    <span
      aria-hidden
      title={`${progressPct(record)}% 읽음`}
      className="absolute -top-2.5 left-1/2 z-10 h-4 w-[6px] -translate-x-1/2 bg-pin [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]"
    />
  );
}

function Bookend({ color, height }) {
  return (
    <span aria-hidden className="relative ml-1 shrink-0 self-end" style={{ width: 18, height: Math.round(height * 0.42) }}>
      <span className="absolute bottom-0 left-0 rounded-t-[6px]" style={{ width: 9, height: '100%', background: color, border: LINE }} />
      <span className="absolute right-0 bottom-0 left-0 h-[7px] rounded-[2px]" style={{ background: color, border: LINE }} />
    </span>
  );
}

// ───────── 치수 · 배치 ─────────

function useDims({ width, compact, arrangement }) {
  const narrow = width > 0 && width < 560;
  const side = compact ? 6 : narrow ? 9 : 12;
  const cellH =
    arrangement === 'polaroid'
      ? compact ? 100 : narrow ? 136 : 166
      : arrangement === 'cover'
        ? compact ? 94 : narrow ? 126 : 156
        : compact ? 86 : narrow ? 120 : 148;
  const caseW = Math.min(width - (compact ? 20 : narrow ? 24 : 64), compact ? 9999 : 960);
  const bays = !compact && caseW >= 720 ? 2 : 1;
  const cellInner = (caseW - side * 2 - side * (bays - 1)) / bays - (compact ? 10 : 18);
  return { narrow, side, cellH, caseW, bays, cellInner };
}

/** 책을 칸에 채운다. 책이 적으면 여러 칸에 고르게 나눠 꽂는다 */
function packCells(records, { arrangement, cellH, cellInner, compact, narrow, minCells = 1 }) {
  const cells = [];
  let cur = { books: [], used: 0 };
  const push = () => {
    cells.push(cur);
    cur = { books: [], used: 0 };
  };
  const spineK = compact ? 0.72 : narrow ? 0.85 : 1;
  const widthOf = (r) => {
    if (arrangement === 'spine') return Math.round(spineWidth(r.book.totalPages) * spineK) + 2;
    if (arrangement === 'polaroid') return (compact ? 64 : narrow ? 86 : 106) + (compact ? 8 : 14);
    return Math.round(cellH * 0.86 * 0.68) + (compact ? 6 : 10);
  };
  const pack = (quota) => {
    cells.length = 0;
    cur = { books: [], used: 0 };
    for (const r of records) {
      const w = widthOf(r);
      if (cur.books.length && (cur.used + w > cellInner || cur.books.length >= quota(cells.length))) push();
      cur.books.push(r);
      cur.used += w;
    }
    if (cur.books.length) push();
  };
  pack(() => Infinity);
  if (records.length && cells.length < minCells) {
    const k = Math.min(minCells, records.length);
    const base = Math.floor(records.length / k);
    const extra = records.length % k;
    pack((i) => base + (i < extra ? 1 : 0));
  }
  return cells.map((c) => ({ ...c, leftover: cellInner - c.used }));
}

// ───────── 책장 ─────────

export default function ShelfScene({
  records = [],
  decoration,
  editable = false,
  selectedId,
  onSelect,
  onMove,
  minRows = 2,
  compact = false,
  linkBooks = true,
  emptyMessage,
  className = '',
}) {
  const themeKey = decoration?.theme ?? 'cream';
  const theme = THEMES[themeKey] ?? THEMES.cream;
  const layout = decoration?.layout ?? { shelfStyle: 'wood', arrangement: 'spine' };
  const arrangement = layout.arrangement || 'spine';
  const cab = cabinetFor(layout.shelfStyle, theme, themeKey);
  const [measureRef, measured] = useElementWidth();
  const width = measured || 640;
  const dims = useDims({ width, compact, arrangement });
  const sceneRef = useRef(null);
  const dragRef = useRef(null);

  const rows = useMemo(() => {
    const cells = packCells(records, { arrangement, ...dims, compact, minCells: minRows * dims.bays });
    const out = [];
    for (let i = 0; i < cells.length; i += dims.bays) out.push(cells.slice(i, i + dims.bays));
    while (out.length < minRows) out.push([]);
    out.forEach((row) => {
      while (row.length < dims.bays) row.push({ books: [], used: 0, leftover: dims.cellInner });
    });
    return out;
  }, [records, arrangement, dims, compact, minRows]);

  // 스티커 드래그 (꾸미기 모드)
  const toPercent = useCallback((clientX, clientY) => {
    const rect = sceneRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    };
  }, []);
  const onPointerDown = (e, d) => {
    if (!editable) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect?.(d.id);
    const p = toPercent(e.clientX, e.clientY);
    dragRef.current = { id: d.id, dx: d.x - p.x, dy: d.y - p.y };
  };
  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const p = toPercent(e.clientX, e.clientY);
    onMove?.(drag.id, Math.max(0, Math.min(100, p.x + drag.dx)), Math.max(0, Math.min(100, p.y + drag.dy)));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const { side, cellH, narrow } = dims;
  const spineK = compact ? 0.72 : narrow ? 0.85 : 1;
  const floorH = compact ? 12 : 28;
  const lineW = compact ? '1.5px' : '2.5px';

  const renderCell = (cell, ri, ci) => {
    const n = cell.books.length;
    const canLean = arrangement === 'spine' && n >= 3 && cell.leftover > cellH * 0.2 + 4;
    const hasBookend = arrangement === 'spine' && n >= 2 && (ri + ci) % 2 === 0 && cell.leftover > (canLean ? cellH * 0.2 + 28 : 26);
    return (
      <div
        key={ci}
        className="relative flex flex-1 items-end overflow-hidden"
        style={{
          height: cellH,
          padding: compact ? '0 5px' : '0 9px',
          gap: arrangement === 'spine' ? 0 : compact ? 6 : arrangement === 'polaroid' ? 14 : 10,
          background: cab.back,
          border: `${compact ? '1.5px' : '2px'} solid ${INK}`,
          borderRadius: compact ? 4 : 7,
        }}
      >
        {cell.books.map((r, i) => {
          const b = r.book;
          const key = b.id || `${ri}-${ci}-${i}`;
          if (arrangement === 'spine') {
            const h = Math.round(cellH * (0.68 + (bookHeightRatio(b.id || b.title) - 0.82) * 1.2));
            const w = Math.round(spineWidth(b.totalPages) * spineK);
            const lean = canLean && i === n - 1;
            return (
              <BookLink
                key={key}
                book={b}
                linkBooks={linkBooks}
                className="mr-[2px] transition-transform duration-200 ease-out hover:-translate-y-2 focus-visible:-translate-y-2"
                style={lean ? { transform: 'rotate(-10deg)', transformOrigin: 'bottom right', marginLeft: Math.round(h * 0.18) } : undefined}
              >
                <Bookmark record={r} />
                <Spine record={r} height={h} width={w} compact={compact} />
              </BookLink>
            );
          }
          if (arrangement === 'polaroid') {
            const cw = compact ? 64 : narrow ? 86 : 106;
            return (
              <BookLink
                key={key}
                book={b}
                linkBooks={linkBooks}
                className="mb-1 transition-transform duration-200 hover:z-10 hover:-translate-y-2"
                style={{ transform: `rotate(${tilt(b.id || b.title, 4)}deg)` }}
              >
                <div className="relative bg-white p-[5px] pb-0" style={{ width: cw, border: `1.5px solid ${INK}` }}>
                  <span className="absolute -top-2 left-1/2 h-3.5 w-9 -translate-x-1/2 rotate-[-4deg] border border-ink/30 bg-rose/90" aria-hidden />
                  <BookCover book={b} className="aspect-[3/4] w-full" rounded="rounded-[1px]" shadow={false} />
                  <p className={`hand truncate px-0.5 py-0.5 text-center text-ink ${compact ? 'text-[11px]' : 'text-[15px]'}`}>{b.title}</p>
                </div>
              </BookLink>
            );
          }
          const h = Math.round(cellH * (0.7 + (bookHeightRatio(b.id || b.title) - 0.82) * 0.75));
          return (
            <BookLink key={key} book={b} linkBooks={linkBooks} className="transition-transform duration-200 hover:-translate-y-2">
              <Bookmark record={r} />
              <BookCover
                book={b}
                className={r.status === 'WANT_TO_READ' ? 'opacity-85' : ''}
                rounded="rounded-[2px_5px_5px_2px]"
                shadow={false}
                style={{ height: h, width: Math.round(h * 0.68) }}
              />
            </BookLink>
          );
        })}
        {hasBookend && <Bookend color={cab.dark ? '#F5D8D8' : cab.accent} height={cellH} />}
      </div>
    );
  };

  return (
    <div
      ref={sceneRef}
      className={`relative isolate overflow-hidden rounded-[3px] border-[1.5px] border-ink/85 ${className}`}
      style={sceneBackground(decoration)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* 바닥 */}
      <div aria-hidden className="absolute inset-x-0 bottom-0" style={{ height: floorH, background: '#E9D7C2', borderTop: `${lineW} solid ${INK}` }} />

      <div
        ref={measureRef}
        className={`relative z-10 flex flex-col items-center ${editable ? 'pointer-events-none' : ''}`}
        style={{ paddingTop: compact ? 10 : narrow ? 40 : 54, paddingBottom: floorH - (compact ? 3 : 6) }}
      >
        <div style={{ width: dims.caseW }} className="relative">
          {/* 상판 */}
          <div
            aria-hidden
            className="relative flex items-center justify-center"
            style={{
              height: compact ? 10 : 18,
              margin: compact ? '0 -4px' : '0 -10px',
              background: cab.frame,
              border: `${lineW} solid ${INK}`,
              borderRadius: compact ? 5 : 9,
            }}
          >
            {!compact && <span className="text-[11px] leading-none" style={{ color: cab.accent }}>♥</span>}
          </div>
          {cab.lace && (
            <div
              aria-hidden
              style={{
                height: compact ? 5 : 9,
                margin: compact ? '0 2px' : '0 4px',
                backgroundImage: `radial-gradient(circle at ${compact ? 5 : 9}px 0, ${cab.frame} ${compact ? 4 : 7}px, ${INK} ${compact ? 4 : 7}px, ${INK} ${compact ? 5 : 8.5}px, transparent ${compact ? 5.5 : 9}px)`,
                backgroundSize: `${compact ? 10 : 18}px ${compact ? 5 : 9}px`,
                backgroundRepeat: 'repeat-x',
              }}
            />
          )}

          {/* 몸통 */}
          <div
            className="relative flex flex-col"
            style={{
              marginTop: cab.lace ? -(compact ? 3 : 6) : compact ? 2 : 4,
              padding: side,
              gap: side,
              background: cab.frame,
              border: `${lineW} solid ${INK}`,
              borderRadius: compact ? 6 : 10,
            }}
          >
            {rows.map((row, ri) => (
              <div key={ri} className="flex" style={{ gap: side }}>
                {row.map((cell, ci) => renderCell(cell, ri, ci))}
              </div>
            ))}
            {records.length === 0 && emptyMessage && (
              <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center px-6 text-center">
                <div className="rounded-[3px] border-[1.5px] border-ink/85 bg-paper px-4 py-3">{emptyMessage}</div>
              </div>
            )}
          </div>

          {/* 다리 */}
          <div aria-hidden className="flex justify-between" style={{ padding: compact ? '0 8px' : '0 18px' }}>
            {[0, 1].map((i) => (
              <span
                key={i}
                className="block"
                style={{
                  width: compact ? 8 : 16,
                  height: compact ? 5 : 9,
                  marginTop: compact ? -1.5 : -2.5,
                  background: cab.frame,
                  border: `${lineW} solid ${INK}`,
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 스티커 · 장식 */}
      <div className={`absolute inset-0 z-20 ${editable ? '' : 'pointer-events-none'}`} onClick={(e) => editable && e.target === e.currentTarget && onSelect?.(null)}>
        {(decoration?.decorations ?? []).map((d) => {
          const size =
            d.kind === 'item' && d.type === 'garland'
              ? compact ? 'h-[34px] w-[140px]' : 'h-[53px] w-[220px]'
              : d.kind === 'item'
                ? compact ? 'h-11 w-11' : 'h-[72px] w-[72px]'
                : compact ? 'h-9 w-9' : 'h-14 w-14';
          const selected = editable && selectedId === d.id;
          return (
            <div
              key={d.id}
              role={editable ? 'button' : undefined}
              tabIndex={editable ? 0 : undefined}
              aria-label={editable ? '장식 선택 (드래그해서 옮기기)' : undefined}
              aria-pressed={editable ? selected : undefined}
              onPointerDown={(e) => onPointerDown(e, d)}
              onKeyDown={(e) => editable && e.key === 'Enter' && onSelect?.(d.id)}
              className={`absolute touch-none select-none ${editable ? 'cursor-grab active:cursor-grabbing' : ''} ${
                selected ? 'rounded-[3px] outline-2 outline-offset-4 outline-link outline-dashed' : ''
              }`}
              style={{ left: `${d.x}%`, top: `${d.y}%`, transform: `translate(-50%, -50%) rotate(${d.rotate}deg) scale(${d.scale})` }}
            >
              <Sticker kind={d.kind} type={d.type} className={size} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
