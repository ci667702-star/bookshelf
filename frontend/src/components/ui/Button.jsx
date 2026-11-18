import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// 레트로 PC 버튼: 잉크 외곽선 + 눌리는 그림자
const RAISED = 'border-[1.5px] border-ink/85 shadow-[2px_2px_0_rgba(81,68,61,0.85)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none';

const VARIANTS = {
  primary: `${RAISED} bg-cocoa-deep text-white hover:bg-[#7c5443]`,
  secondary: `${RAISED} bg-rose text-ink hover:bg-rose-deep`,
  soft: `${RAISED} bg-chrome text-ink hover:bg-kraft-deep`,
  green: `${RAISED} bg-lime text-ink hover:brightness-95`,
  outline: `${RAISED} bg-paper text-ink hover:bg-milk`,
  ghost: 'border-[1.5px] border-transparent text-ink-soft hover:border-ink/30 hover:bg-chrome hover:text-ink',
  danger: `${RAISED} bg-berry text-white hover:bg-[#a33f3a]`,
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
  return `inline-flex items-center justify-center gap-1.5 rounded-[6px] font-semibold whitespace-nowrap transition-[background-color,color,transform,box-shadow] duration-100 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
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
