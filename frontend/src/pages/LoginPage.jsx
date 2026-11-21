import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { AuthWindow } from '../layouts/AuthLayout.jsx';
import { Field, Input, FormError } from '../components/ui/Field.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';

export default function LoginPage() {
  useDocumentTitle('로그인');
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = '올바른 이메일 주소를 입력해 주세요.';
    if (!form.password) errs.password = '비밀번호를 입력해 주세요.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setServerError(null);
    try {
      const user = await login({ ...form, email: form.email.trim() });
      toast.success(`${user.nickname}님, 다시 만나서 반가워요!`);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setServerError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWindow title="북모먼트 로그인">
      <h1 className="text-[26px]">다시 책장 앞으로</h1>
      <p className="mt-1 mb-6 text-[14px] text-ink-soft">오늘 읽은 한 페이지를 기록해 볼까요?</p>
      {location.state?.expired && !serverError && (
        <p className="mb-4 rounded-[3px] bg-butter/70 px-4 py-3 text-[13px]">로그인이 만료되었어요. 다시 로그인해 주세요.</p>
      )}
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <FormError message={serverError?.message} />
        <Field label="이메일" error={errors.email || serverError?.fields?.email}>
          <Input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="비밀번호" error={errors.password}>
          <div className="relative">
            <Input
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="pr-11"
              aria-invalid={errors.password ? 'true' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-ink-soft hover:text-ink"
            >
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-[13.5px]">
          <input
            type="checkbox"
            checked={form.remember}
            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            className="h-4 w-4 accent-ink"
          />
          로그인 상태 유지 (30일)
        </label>
        <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
          로그인
        </Button>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-ink-soft">
        아직 계정이 없나요?{' '}
        <Link to="/signup" state={location.state} className="font-semibold text-link underline underline-offset-4">
          회원가입
        </Link>
      </p>
    </AuthWindow>
  );
}
