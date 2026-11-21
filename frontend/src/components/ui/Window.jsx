import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

/** 화면 · 패널마다 다른 책갈피 끈 색 */
export const RIBBON_TONES = {
  lime: 'fill-matcha',
  tangerine: 'fill-tangerine',
  aqua: 'fill-sky',
  rose: 'fill-rose-deep',
  butter: 'fill-butter',
  lilac: 'fill-lilac',
  green: 'fill-matcha',
  sky: 'fill-sky',
  kraft: 'fill-kraft-deep',
};

/** 책갈피 끈: 위에서 늘어진 리본, 끝은 V자로 잘려 있다 */
export function Ribbon({ tone = 'rose', className = '' }) {
  return (
    <svg viewBox="0 0 18 44" className={`text-ink ${className}`} aria-hidden>
      <path
        d="M1.5 0V41.5L9 34.5L16.5 41.5V0"
        className={RIBBON_TONES[tone] ?? 'fill-rose-deep'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M5 0V30" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
    </svg>
  );
}

/** 닫기 버튼 (실제로 닫히거나 이동할 때만 표시) */
export function CloseBox({ onClose, closeTo, label = '닫기' }) {
  const cls =
    'grid h-8 w-8 shrink-0 place-items-center rounded-[3px] text-ink transition hover:bg-rose/60 active:translate-y-px';
  if (closeTo) {
    return (
      <Link to={closeTo} aria-label={label} className={cls}>
        <X size={17} strokeWidth={2.2} />
      </Link>
    );
  }
  if (onClose) {
    return (
      <button type="button" onClick={onClose} aria-label={label} className={cls}>
        <X size={17} strokeWidth={2.2} />
      </button>
    );
  }
  return null;
}

/** 머리말 줄의 작은 메뉴 (뒤로 · 새로 고침 · 홈으로) — 모두 실제 동작한다 */
function RunningHead({ title, menu }) {
  const cls = 'shrink-0 rounded-[3px] px-1.5 py-0.5 text-[12.5px] text-ink-soft transition hover:bg-rose/50 hover:text-ink';
  return (
    <nav aria-label={`${title} 메뉴`} className="scrollbar-none -mx-1.5 flex items-center gap-1 overflow-x-auto">
      {menu.map((m) =>
        m.to ? (
          <Link key={m.label} to={m.to} className={cls}>
            {m.label}
          </Link>
        ) : (
          <button key={m.label} type="button" onClick={m.onClick} className={cls}>
            {m.label}
          </button>
        )
      )}
    </nav>
  );
}

/**
 * 책 한 장 (패널)
 * - size="lg": 화면 본문. 책의 머리말처럼 위쪽 한 줄에 메뉴와 화면 이름을 작게, 큰 제목은 각 페이지의 h1 이 맡는다
 * - size="md": 옆 칸 · 홈 위젯 같은 작은 패널. 명조 제목 + 이중 괘선
 * menu: [{ label, to?, onClick? }]
 */
export default function Window({
  title,
  tone = 'rose',
  icon: Icon,
  menu,
  onClose,
  closeTo,
  children,
  className = '',
  bodyClassName = 'p-4 sm:p-6',
  footer,
  as: Tag = 'section',
  titleId,
  size = 'md',
}) {
  const lg = size === 'lg';
  return (
    <Tag
      className={`relative flex min-w-0 flex-col rounded-[3px] border-[1.5px] border-ink/85 bg-paper ${
        lg ? 'shadow-[var(--shadow-pages)]' : 'shadow-[var(--shadow-page)]'
      } ${className}`}
      aria-labelledby={titleId}
    >
      <Ribbon tone={tone} className={`absolute -top-[1.5px] ${lg ? 'right-4 h-12 w-[19px] sm:right-7 sm:h-14 sm:w-[22px]' : 'right-3.5 h-9 w-[15px]'}`} />
      {lg ? (
        <>
          <header className="flex min-h-11 items-center gap-3 px-4 pr-12 sm:px-7 sm:pr-20">
            {menu?.length ? <RunningHead title={title} menu={menu} /> : null}
            <p id={titleId} className="ml-auto min-w-0 truncate font-serif text-[13px] font-semibold text-ink-soft">
              {title}
            </p>
            <CloseBox onClose={onClose} closeTo={closeTo} />
          </header>
          <div className="mx-4 h-px bg-ink/35 sm:mx-7" aria-hidden />
        </>
      ) : (
        <>
          <header className="flex items-center gap-2 px-3.5 pt-3 pr-10">
            {Icon && <Icon size={15} strokeWidth={2.2} className="shrink-0 text-ink/80" aria-hidden />}
            <h2 id={titleId} className="min-w-0 flex-1 truncate font-serif text-[15.5px] font-bold text-ink">
              {title}
            </h2>
            <CloseBox onClose={onClose} closeTo={closeTo} />
          </header>
          <div className="rule-book mx-3.5 mt-2 h-[5px] border-t-2 text-ink/85" aria-hidden />
        </>
      )}
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
      {footer && <div className="mx-3.5 shrink-0 border-t border-ink/20 py-2 text-[12.5px] text-ink-soft">{footer}</div>}
    </Tag>
  );
}
