import { Link } from 'react-router-dom';

/** 분홍 종이 위 남색 잉크로 찍은 책 세 권 */
export function LogoMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="12" fill="#EFB3BB" />
      <rect x="13" y="15" width="11" height="35" rx="1.5" fill="#233E7C" />
      <rect x="13" y="21" width="11" height="2.5" fill="#EFB3BB" />
      <rect x="13" y="42" width="11" height="2.5" fill="#EFB3BB" />
      <rect x="26" y="22" width="9" height="28" rx="1.5" fill="#FFF9F2" stroke="#233E7C" strokeWidth="2" />
      <rect x="38" y="12" width="11" height="38" rx="1.5" transform="rotate(9 43.5 31)" fill="#233E7C" />
      <rect x="10" y="50" width="44" height="3.5" fill="#233E7C" />
    </svg>
  );
}

export default function Logo({ to = '/', size = 'md' }) {
  const big = size === 'lg';
  return (
    <Link to={to} className="group inline-flex items-center gap-2" aria-label="북모먼트 홈">
      <LogoMark className={big ? 'h-10 w-10' : 'h-8 w-8'} />
      <span className="flex flex-col leading-none">
        <span className={`wordmark text-ink ${big ? 'text-[28px]' : 'text-[23px]'}`}>북모먼트</span>
        <span className="mt-1 text-[10.5px] font-semibold tracking-[0.12em] text-ink-soft">BookMoment</span>
      </span>
    </Link>
  );
}
