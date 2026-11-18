import { useId, useState } from 'react';
import { Star, Lock, Globe } from 'lucide-react';
import { STATUS } from '../../utils/constants.js';
import { hashString } from '../../utils/color.js';

const AVATAR_BG = ['bg-rose', 'bg-matcha', 'bg-sky', 'bg-butter', 'bg-lilac', 'bg-kraft'];

export function Avatar({ user, size = 36, className = '' }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: Math.max(11, size * 0.42) };
  if (user?.profileImage && !broken) {
    return (
      <img
        src={user.profileImage}
        alt=""
        onError={() => setBroken(true)}
        className={`shrink-0 rounded-full border-[1.5px] border-paper object-cover shadow-[0_0_0_1px_rgba(164,119,98,0.25)] ${className}`}
        style={style}
      />
    );
  }
  const bg = AVATAR_BG[hashString(user?.id || user?.nickname || '') % AVATAR_BG.length];
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full font-serif font-bold text-ink shadow-[0_0_0_1px_rgba(164,119,98,0.25)] ${bg} ${className}`}
      style={style}
    >
      {(user?.nickname || '?').slice(0, 1)}
    </span>
  );
}

/** 별점 표시 / 입력 */
export function StarRating({ value = 0, onChange, size = 18, label = '별점' }) {
  const [hover, setHover] = useState(0);
  const name = useId();
  const shown = hover || value || 0;
  if (!onChange) {
    if (!value) return null;
    return (
      <span className="inline-flex items-center gap-0.5" aria-label={`${label} ${value}점 / 5점`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            strokeWidth={2}
            className={n <= value ? 'fill-[#F2C94C] text-[#C79A2E]' : 'fill-kraft text-kraft-deep'}
          />
        ))}
      </span>
    );
  }
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="cursor-pointer rounded-md p-0.5 transition hover:scale-110" onMouseEnter={() => setHover(n)}>
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            onClick={() => value === n && onChange(null)}
            className="sr-only"
            aria-label={`${n}점`}
          />
          <Star
            size={size}
            strokeWidth={2}
            className={n <= shown ? 'fill-[#F2C94C] text-[#C79A2E]' : 'fill-paper text-kraft-deep'}
          />
        </label>
      ))}
      {value ? <span className="ml-1 text-[13px] text-ink-soft">{value}점</span> : null}
    </div>
  );
}

export function StatusBadge({ status, className = '' }) {
  const s = STATUS[status];
  if (!s) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${s.tone} ${className}`}>
      {s.label}
    </span>
  );
}

export function PrivacyBadge({ isPublic, className = '' }) {
  return isPublic ? (
    <span className={`inline-flex items-center gap-1 rounded-full bg-matcha px-2.5 py-0.5 text-[12px] font-semibold text-matcha-deep ${className}`}>
      <Globe size={12} strokeWidth={2.4} /> 공개
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1 rounded-full bg-kraft px-2.5 py-0.5 text-[12px] font-semibold text-ink-soft ${className}`}>
      <Lock size={12} strokeWidth={2.4} /> 비공개
    </span>
  );
}

export function ProgressBar({ value = 0, tone = 'bg-cocoa', className = '', label }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-kraft ${className}`}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ${tone}`} style={{ width: `${v}%` }} />
    </div>
  );
}

/** 공개 / 비공개 스위치 */
export function Toggle({ checked, onChange, label, description }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 rounded-[8px] bg-milk px-4 py-3">
      <div>
        <label htmlFor={id} className="text-[14px] font-semibold">
          {label}
        </label>
        {description && <p className="text-[12.5px] text-ink-soft">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border-[1.5px] border-ink/70 transition-colors ${checked ? 'bg-matcha' : 'bg-kraft'}`}
      >
        <span
          className={`absolute top-[2px] h-5 w-5 rounded-full border-[1.5px] border-ink/70 bg-paper transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
        />
      </button>
    </div>
  );
}

/** 알약 모양 세그먼트 탭 */
export function Segmented({ options, value, onChange, label, size = 'md' }) {
  return (
    <div role="tablist" aria-label={label} className="scrollbar-none flex max-w-full gap-1 overflow-x-auto rounded-full bg-kraft/80 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full font-semibold transition ${
              size === 'sm' ? 'h-8 px-3 text-[12.5px]' : 'h-9 px-4 text-[13.5px]'
            } ${active ? 'bg-paper text-ink shadow-[0_1px_0_rgba(81,68,61,0.15),0_2px_6px_-2px_rgba(81,68,61,0.25)]' : 'text-ink-soft hover:text-ink'}`}
          >
            {o.icon}
            {o.label}
            {o.count != null && <span className="text-[11.5px] text-ink-soft">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function SectionTitle({ title, action, children }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[21px] text-ink sm:text-[23px]">{title}</h2>
        {children && <p className="mt-0.5 text-[13.5px] text-ink-soft">{children}</p>}
      </div>
      {action}
    </div>
  );
}
