import { createContext, useContext, useState } from 'react';
import { coverPalette } from '../../utils/color.js';

/**
 * 책 표지 (평면 스타일). 이미지가 없거나 깨지면 제목으로 만든 표지를 보여준다.
 * 글자 크기는 컨테이너 너비(cqw)에 맞춰 자동 조절.
 */
/** 이미지로 저장할 때 다른 사이트 표지를 서버 프록시로 바꿔 끼우기 위한 컨텍스트 */
export const CoverSrcContext = createContext(null);

export default function BookCover({ book, className = '', rounded = 'rounded-[2px_6px_6px_2px]', shadow = true, style }) {
  const [broken, setBroken] = useState(false);
  if (!book) return null;
  const pal = coverPalette(book.id || book.title);
  const transformSrc = useContext(CoverSrcContext);
  const hasImg = book.coverImage && !broken;
  const src = hasImg && transformSrc ? transformSrc(book.coverImage) : book.coverImage;

  return (
    <div
      className={`@container relative overflow-hidden border-[1.5px] border-ink/85 ${rounded} ${shadow ? 'shadow-[3px_3px_0_rgba(35,62,124,0.28)]' : ''} ${className}`}
      style={{ background: pal.bg, ...style }}
    >
      {hasImg ? (
        <img src={src} alt={`${book.title} 표지`} loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col p-[10%] pl-[16%]" style={{ color: pal.fg }} role="img" aria-label={`${book.title} 표지`}>
          <span className="block h-[3px] w-[34%]" style={{ background: pal.band }} />
          <p className="mt-[12%] line-clamp-4 font-serif text-[14cqw] leading-[1.18] font-extrabold tracking-[-0.01em] break-keep">{book.title}</p>
          <p className="mt-auto truncate text-[9cqw] font-semibold opacity-80">{book.author}</p>
        </div>
      )}
      {/* 제본선 */}
      <span className="pointer-events-none absolute inset-y-0 left-[7%] w-[1.5px] bg-ink/25" aria-hidden />
    </div>
  );
}
