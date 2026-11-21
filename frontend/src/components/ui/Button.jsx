import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// 두 가지 잉크로 찍은 버튼: 남색 면 + 살짝 어긋나 찍힌 분홍 그림자. 누르면 잉크가 맞물린다
const PRESS = 'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none';
const LINE = 'border-[1.5px] border-ink/85';

const VARIANTS = {
  primary: `border-[1.5px] border-ink bg-ink text-milk shadow-[var(--shadow-misprint)] hover:bg-ink-deep ${PRESS}`,
  secondary: `${LINE} bg-rose text-ink hover:bg-rose-deep active:translate-y-px`,
  soft: 'border-[1.5px] border-transparent bg-kraft text-ink hover:bg-kraft-deep active:translate-y-px',
  green: `${LINE} bg-matcha text-ink hover:brightness-95 active:translate-y-px`,
  outline: `${LINE} bg-paper text-ink hover:bg-rose/40 active:translate-y-px`,
  ghost: 'border-[1.5px] border-transparent text-ink-soft hover:bg-rose/40 hover:text-ink',
  danger: `border-[1.5px] border-berry bg-berry text-white shadow-[var(--shadow-misprint)] hover:bg-[#a5302a] ${PRESS}`,
  'danger-ghost': 'border-[1.5px] border-transparent text-berry hover:border-berry/40 hover:bg-rose/60',
};

const SIZES = {
  xs: 'h-8 px-2.5 text-[12.5px]',
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-10 px-4 text-[14px]',
  lg: 'h-12 px-5 text-[15px]',
  icon: 'h-10 w-10',
  'icon-sm': 'h-8 w-8',
};

export function buttonClass(variant = 'primary', size = 'md', extra = '') {
  return `inline-flex items-center justify-center gap-1.5 rounded-[3px] font-semibold whitespace-nowrap transition-[background-color,color,transform,box-shadow] duration-100 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  to,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}) {
  const cls = buttonClass(variant, size, className);
  const content = (
    <>
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}
