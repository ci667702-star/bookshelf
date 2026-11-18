import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export const TITLE_TONES = {
  lime: 'bg-lime',
  tangerine: 'bg-tangerine',
  aqua: 'bg-aqua',
  rose: 'bg-rose',
  butter: 'bg-butter',
  lilac: 'bg-lilac',
  green: 'bg-matcha',
  sky: 'bg-sky',
  kraft: 'bg-kraft',
};

/** 제목줄 오른쪽 닫기 버튼 (실제로 닫히거나 이동할 때만 표시) */
export function CloseBox({ onClose, closeTo, label = '창 닫기' }) {
  const cls =
    'grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[3px] border-[1.5px] border-ink/85 bg-paper bevel transition hover:bg-milk active:bevel-in';
  if (closeTo) {
    return (
      <Link to={closeTo} aria-label={label} className={cls}>
        <X size={13} strokeWidth={3} />
      </Link>
    );
  }
  if (onClose) {
    return (
      <button type="button" onClick={onClose} aria-label={label} className={cls}>
        <X size={13} strokeWidth={3} />
      </button>
    );
  }
  return null;
}

/**
 * 레트로 PC 창
 * menu: [{ label, to?, onClick? }] — 메뉴줄의 항목은 모두 실제 동작한다
 */
export default function Window({
  title,
  tone = 'lime',
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
}) {
  return (
    <Tag
      className={`flex min-w-0 flex-col overflow-hidden rounded-[6px] border-[1.5px] border-ink/85 bg-paper shadow-[4px_4px_0_rgba(81,68,61,0.85)] ${className}`}
      aria-labelledby={titleId}
    >
      <div className={`flex h-9 shrink-0 items-center gap-2 border-b-[1.5px] border-ink/85 px-2.5 ${TITLE_TONES[tone] ?? tone}`}>
        {Icon && (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[3px] border-[1.5px] border-ink/80 bg-paper">
            <Icon size={13} strokeWidth={2.4} />
          </span>
        )}
        <p id={titleId} className="min-w-0 flex-1 truncate font-pixel text-[13px] font-bold">
          {title}
        </p>
        <CloseBox onClose={onClose} closeTo={closeTo} />
      </div>
      {menu?.length ? (
        <nav aria-label={`${title} 메뉴`} className="scrollbar-none flex shrink-0 gap-0.5 overflow-x-auto border-b border-ink/25 bg-chrome px-1.5 py-1">
          {menu.map((m) =>
            m.to ? (
              <Link key={m.label} to={m.to} className="shrink-0 rounded-[3px] px-2 py-0.5 font-pixel text-[12px] hover:bg-link hover:text-white">
                {m.label}
              </Link>
            ) : (
              <button
                key={m.label}
                type="button"
                onClick={m.onClick}
                className="shrink-0 rounded-[3px] px-2 py-0.5 font-pixel text-[12px] hover:bg-link hover:text-white"
              >
                {m.label}
              </button>
            )
          )}
        </nav>
      ) : null}
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
      {footer && <div className="shrink-0 border-t border-ink/25 bg-chrome px-3 py-1.5 font-pixel text-[11.5px] text-ink-soft">{footer}</div>}
    </Tag>
  );
}
