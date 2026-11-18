import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PageLoader } from '../components/ui/States.jsx';
import Logo from '../components/ui/Logo.jsx';
import Sticker from '../components/ui/Sticker.jsx';

/** 로그인 · 회원가입: 레트로 체크 배경 위의 창 */
export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageLoader />;
  if (user) return <Navigate to={location.state?.from || '/dashboard'} replace />;

  return (
    <div className="checker relative flex min-h-dvh flex-col items-center px-4 py-8 sm:py-14">
      <div className="mb-6 rounded-full bg-milk/95 px-4 py-2 shadow-[var(--shadow-soft)]">
        <Logo />
      </div>
      <div className="relative w-full max-w-[460px]">
        <Sticker type="ribbon" className="absolute -top-6 -left-5 z-10 h-14 w-14 -rotate-12 sm:-left-8" />
        <Sticker type="star" className="absolute -right-4 -bottom-5 z-10 h-12 w-12 rotate-12 sm:-right-7" />
        <Outlet />
      </div>
    </div>
  );
}

export function AuthWindow({ title, tone = 'bg-rose', children }) {
  return (
    <div className="animate-pop overflow-hidden rounded-[16px] border-[1.5px] border-ink/85 bg-paper shadow-[7px_7px_0_rgba(81,68,61,0.85)]">
      <div className={`flex h-11 items-center gap-2.5 border-b-[1.5px] border-ink/85 px-4 ${tone}`}>
        <span className="flex gap-1" aria-hidden>
          <i className="h-2.5 w-2.5 rounded-full border-[1.5px] border-ink/70 bg-paper" />
          <i className="h-2.5 w-2.5 rounded-full border-[1.5px] border-ink/70 bg-paper/60" />
        </span>
        <p className="text-[13.5px] font-bold">{title}</p>
      </div>
      <div className="p-6 sm:p-8">{children}</div>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { user, isLoading, isError } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageLoader label="로그인 정보를 확인하는 중..." />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search, expired: isError }} />;
  }
  return children;
}
