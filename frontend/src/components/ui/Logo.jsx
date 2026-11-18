import { Link } from 'react-router-dom';

export function LogoMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="18" fill="#F5D8D8" />
      <rect x="14" y="16" width="10" height="34" rx="2.5" fill="#A47762" />
      <rect x="26" y="22" width="9" height="28" rx="2.5" fill="#DDE8D7" stroke="#51443D" strokeWidth="1.8" />
      <rect x="37" y="12" width="12" height="38" rx="2.5" transform="rotate(8 43 31)" fill="#FFF9F2" stroke="#51443D" strokeWidth="1.8" />
      <rect x="10" y="50" width="44" height="4" rx="2" fill="#51443D" />
    </svg>
  );
}

export default function Logo({ to = '/', size = 'md' }) {
  const big = size === 'lg';
  return (
    <Link to={to} className="group inline-flex items-center gap-2" aria-label="북모먼트 홈">
      <LogoMark className={big ? 'h-10 w-10' : 'h-8 w-8'} />
      <span className="flex flex-col leading-none">
        <span className={`wordmark text-cocoa-deep ${big ? 'text-[26px]' : 'text-[21px]'}`}>BookMoment</span>
        <span className="mt-0.5 text-[10.5px] font-semibold tracking-[0.18em] text-ink-soft">북모먼트</span>
      </span>
    </Link>
  );
}
