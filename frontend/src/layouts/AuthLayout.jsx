import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PageLoader } from '../components/ui/States.jsx';
import Logo from '../components/ui/Logo.jsx';
import Sticker from '../components/ui/Sticker.jsx';
import { Ribbon } from '../components/ui/Window.jsx';

/** 로그인 · 회원가입: 판화지 결 위에 펼친 책장 한 장 */
export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageLoader />;
  if (user) return <Navigate to={location.state?.from || '/dashboard'} replace />;

  return (
    <div className="engraved relative flex min-h-dvh flex-col items-center px-4 py-8 sm:py-14">
      <div className="mb-7">
        <Logo />
      </div>
      <div className="relative w-full max-w-[460px]">
        <Sticker type="star" className="absolute -right-4 -bottom-5 z-10 h-12 w-12 rotate-12 sm:-right-7" />
        <Outlet />
      </div>
    </div>
  );
}

/** tone: 책갈피 끈 색 (rose · green 등) */
export function AuthWindow({ title, tone = 'rose', children }) {
  return (
    <div className="relative animate-pop rounded-[3px] border-[1.5px] border-ink/85 bg-paper shadow-[var(--shadow-pages)]">
      <Ribbon tone={tone} className="absolute -top-[1.5px] right-6 h-14 w-[22px]" />
      <div className="flex min-h-11 items-center px-6 pr-16 sm:px-8">
        <p className="font-serif text-[13px] font-semibold text-ink-soft">{title}</p>
      </div>
      <div className="mx-6 h-px bg-ink/35 sm:mx-8" aria-hidden />
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
