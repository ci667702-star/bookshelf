import { useLayoutEffect, useRef, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import penKo from '@fontsource/nanum-pen-script/files/nanum-pen-script-korean-400-normal.woff2?url';
import penLatin from '@fontsource/nanum-pen-script/files/nanum-pen-script-latin-400-normal.woff2?url';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { FormError } from '../ui/Field.jsx';
import { LogoMark } from '../ui/Logo.jsx';
import BookCover, { CoverSrcContext } from '../book/BookCover.jsx';
import ShelfScene from '../book/ShelfScene.jsx';
import { proxiedImage } from '../../services/index.js';
import { tilt } from '../../utils/color.js';
import { num } from '../../utils/format.js';

const CARD_W = 540;
const TRANSPARENT = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

const toDataUrl = async (url) => {
  const blob = await fetch(url).then((r) => r.blob());
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(blob);
  });
};

const SERIF = 'Hahmlet Variable';

/** 'U+d723-d728,U+f900' → [[0xd723, 0xd728], [0xf900, 0xf900]] */
const parseRanges = (s) =>
  String(s)
    .split(',')
    .map((r) => r.trim().replace(/^U\+/i, ''))
    .filter(Boolean)
    .map((r) => {
      const [a, b = a] = r.split('-');
      return [parseInt(a.replace(/\?/g, '0'), 16), parseInt(b.replace(/\?/g, 'f'), 16)];
    });

/** 지금 페이지에 실린 명조(Hahmlet) 조각 목록: { url, ranges } — 개발 · 배포 어디서든 실제 주소를 그대로 쓴다 */
function serifFaces() {
  const faces = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // 다른 출처의 스타일시트
    }
    for (const rule of rules) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      if (!rule.style.getPropertyValue('font-family').includes(SERIF)) continue;
      const src = rule.style.getPropertyValue('src').match(/url\(["']?([^"')]+)["']?\)/)?.[1];
      if (src) faces.push({ url: new URL(src, sheet.href ?? location.href).href, ranges: parseRanges(rule.style.getPropertyValue('unicode-range') || 'U+0-10FFFF') });
    }
  }
  return faces;
}

// 그림 안에 실제로 쓰인 글자가 들어 있는 글꼴 조각만 넣는다 (한글 명조 전체를 넣으면 너무 무겁다)
const dataUrlCache = new Map();
const cachedDataUrl = (url) => {
  if (!dataUrlCache.has(url)) dataUrlCache.set(url, toDataUrl(url));
  return dataUrlCache.get(url);
};
async function fontCss(node) {
  const codes = new Set([...(node.textContent ?? '')].map((ch) => ch.codePointAt(0)));
  codes.add(0x30); // 숫자 · 영문 조각은 항상
  const used = serifFaces().filter((f) => f.ranges.some(([a, b]) => [...codes].some((c) => c >= a && c <= b)));
  const [pk, pl, ...serif] = await Promise.all([cachedDataUrl(penKo), cachedDataUrl(penLatin), ...used.map((f) => cachedDataUrl(f.url))]);
  return [
    `@font-face{font-family:'Nanum Pen Script';src:url(${pk}) format('woff2');}`,
    `@font-face{font-family:'Nanum Pen Script';src:url(${pl}) format('woff2');unicode-range:U+0000-00FF;}`,
    ...used.map(
      (f, i) =>
        `@font-face{font-family:'${SERIF}';font-weight:100 900;src:url(${serif[i]}) format('woff2');unicode-range:${f.ranges
          .map(([a, b]) => `U+${a.toString(16)}-${b.toString(16)}`)
          .join(',')};}`
    ),
  ].join('\n');
}

/** 미리보기 + PNG 저장 / 공유 */
export function ShareImageModal({ open, onClose, title, filename, children }) {
  const wrapRef = useRef(null);
  const cardRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    if (!open) return undefined;
    const measure = () => {
      if (!wrapRef.current || !cardRef.current) return;
      const s = Math.min(1, wrapRef.current.clientWidth / CARD_W);
      setScale(s);
      setHeight(cardRef.current.offsetHeight * s);
    };
    const ro = new ResizeObserver(measure);
    requestAnimationFrame(() => {
      if (wrapRef.current) ro.observe(wrapRef.current);
      if (cardRef.current) ro.observe(cardRef.current);
      measure();
    });
    return () => ro.disconnect();
  }, [open]);

  const render = async () => {
    setError('');
    setBusy(true);
    try {
      return await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
        fontEmbedCSS: await fontCss(cardRef.current),
        imagePlaceholder: TRANSPARENT,
        backgroundColor: '#FFF9F2',
      });
    } catch {
      setError('이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    const url = await render();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.png`;
    a.click();
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.canShare;
  const share = async () => {
    const url = await render();
    if (!url) return;
    const blob = await fetch(url).then((r) => r.blob());
    const file = new File([blob], `${filename}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title }).catch(() => {});
    } else {
      setError('이 기기에서는 바로 공유할 수 없어요. 「이미지 저장」을 눌러 주세요.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      tone="tangerine"
      size="lg"
      footer={
        <>
          {canShare && (
            <Button variant="outline" onClick={share} disabled={busy}>
              <Share2 size={15} /> 공유
            </Button>
          )}
          <Button onClick={save} loading={busy}>
            <Download size={15} /> 이미지 저장
          </Button>
        </>
      }
    >
      <FormError message={error} />
      <div ref={wrapRef} className="w-full" style={{ height: height || undefined }}>
        <div style={{ width: CARD_W, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <CoverSrcContext.Provider value={proxiedImage}>
            <div ref={cardRef} style={{ width: CARD_W }}>
              {children}
            </div>
          </CoverSrcContext.Provider>
        </div>
      </div>
      <p className="mt-3 text-[12px] text-ink-soft">미리보기와 똑같은 그림이 저장돼요. (가로 1080px)</p>
    </Modal>
  );
}

function CardFrame({ children, tone = 'bg-milk' }) {
  return (
    <div className={`${tone} p-6 text-ink`} style={{ fontFamily: `'${SERIF}', serif` }}>
      {children}
      <div className="rule-book mt-5 text-ink/80" aria-hidden />
      <div className="flex items-center justify-between pt-2.5 text-[12px] font-semibold">
        <span className="flex items-center gap-1.5">
          <LogoMark className="h-5 w-5" /> 북모먼트 BookMoment
        </span>
        <span>오늘 읽은 한 페이지가 나만의 책장이 됩니다</span>
      </div>
    </div>
  );
}

function StatBox({ label, value, unit, tone }) {
  return (
    <div className={`rounded-[3px] border-[1.5px] border-ink/85 ${tone} px-3 py-2`}>
      <p className="text-[11px] text-ink/70">{label}</p>
      <p className="text-[20px] font-bold leading-tight">
        {value}
        <span className="ml-0.5 text-[11px]">{unit}</span>
      </p>
    </div>
  );
}

/** 책장 공유 카드 */
export function ShelfShareCard({ shelf, owner, records, decoration, stats }) {
  return (
    <CardFrame>
      <p className="text-[12px] text-ink/70">{owner?.nickname}님의 책장</p>
      <h2 className="mt-1 text-[30px] font-extrabold tracking-[-0.035em]">{shelf.name}</h2>
      {shelf.description && <p className="mt-1 text-[12.5px] leading-relaxed text-ink/80">{shelf.description}</p>}
      <div className="mt-4">
        <ShelfScene records={records} decoration={decoration} linkBooks={false} minRows={2} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatBox label="꽂힌 책" value={stats.books} unit="권" tone="bg-sky" />
        <StatBox label="완독" value={stats.finished} unit="권" tone="bg-matcha" />
        <StatBox label="쌓은 높이" value={stats.heightCm} unit="cm" tone="bg-butter" />
      </div>
    </CardFrame>
  );
}

/** 이번 달 독서 결산 카드 */
export function MonthShareCard({ data, nickname }) {
  const days = Object.values(data.days);
  const finished = days.flatMap((d) => d.finished.map((f) => ({ ...f, date: d.date }))).slice(0, 6);
  const readBooks = [...new Map(days.flatMap((d) => d.logs.map((l) => [l.book.id, l.book]))).values()].slice(0, 8);
  const s = data.stats;
  return (
    <CardFrame tone="kraft-paper">
      <div className="rounded-[3px] border-[1.5px] border-ink/85 bg-paper p-5">
        <p className="text-[12px] text-ink/70">{nickname}님의</p>
        <h2 className="mt-1 text-[30px] font-extrabold tracking-[-0.035em]">
          {data.year}년 {data.month}월의 독서
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatBox label="읽은 페이지" value={num(s.totalPages)} unit="쪽" tone="bg-butter" />
          <StatBox label="쌓은 높이" value={s.heightCm} unit="cm" tone="bg-sky" />
          <StatBox label="읽은 날" value={s.readingDays} unit="일" tone="bg-rose" />
          <StatBox label="완독" value={s.finishedCount} unit="권" tone="bg-matcha" />
          <StatBox label="읽은 시간" value={s.totalMinutes ?? 0} unit="분" tone="bg-lilac" />
          <StatBox label="최장 연속" value={s.bestStreak} unit="일" tone="bg-paper" />
        </div>

        <h3 className="mt-5 text-[14px] font-bold">이달의 완독</h3>
        {finished.length === 0 ? (
          <p className="mt-1 text-[12.5px] text-ink/70">이번 달 완독은 아직이에요.</p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-4 px-1">
            {finished.map((f) => (
              <div
                key={f.recordId}
                className="relative border-[1.5px] border-ink/80 bg-white p-1.5 pb-0"
                style={{ transform: `rotate(${tilt(f.recordId, 4)}deg)` }}
              >
                <span className="absolute -top-2 left-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[1.5px] border-[#7d2622] bg-pin" />
                <BookCover book={f.book} className="aspect-[3/4] w-full" rounded="rounded-none" shadow={false} />
                <p className="truncate py-0.5 text-center text-[15px]" style={{ fontFamily: "'Nanum Pen Script', cursive" }}>
                  {Number(f.date.slice(5, 7))}월 {Number(f.date.slice(8, 10))}일
                </p>
              </div>
            ))}
          </div>
        )}

        {readBooks.length > 0 && (
          <>
            <h3 className="mt-5 text-[14px] font-bold">이달에 펼친 책</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {readBooks.map((b) => (
                <BookCover key={b.id} book={b} className="h-[64px] w-[45px]" />
              ))}
            </div>
          </>
        )}
      </div>
    </CardFrame>
  );
}
