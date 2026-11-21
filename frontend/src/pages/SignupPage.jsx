import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, X } from 'lucide-react';
import { AuthWindow } from '../layouts/AuthLayout.jsx';
import { Field, Input, FormError } from '../components/ui/Field.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';

const NICK_RE = /^[가-힣a-zA-Z0-9_.-]+$/;

function validate(f) {
  const e = {};
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = '올바른 이메일 주소를 입력해 주세요.';
  if (f.password.length < 8) e.password = '비밀번호는 8자 이상이어야 해요.';
  else if (!/[A-Za-z]/.test(f.password) || !/[0-9]/.test(f.password)) e.password = '영문과 숫자를 모두 포함해 주세요.';
  if (f.password !== f.passwordConfirm) e.passwordConfirm = '비밀번호가 서로 달라요.';
  const nick = f.nickname.trim();
  if (nick.length < 2 || nick.length > 20) e.nickname = '닉네임은 2~20자로 입력해 주세요.';
  else if (!NICK_RE.test(nick)) e.nickname = '한글, 영문, 숫자, _ . - 만 쓸 수 있어요.';
  return e;
}

export default function SignupPage() {
  useDocumentTitle('회원가입');
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [f, setF] = useState({ email: '', password: '', passwordConfirm: '', nickname: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const pickFile = (fl) => {
    if (!fl) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(fl.type)) {
      return setErrors((e) => ({ ...e, profile: 'jpg, png, webp, gif 이미지만 올릴 수 있어요.' }));
    }
    if (fl.size > 5 * 1024 * 1024) return setErrors((e) => ({ ...e, profile: '5MB 이하 이미지만 올릴 수 있어요.' }));
    setErrors((e) => ({ ...e, profile: undefined }));
    setFile(fl);
    setPreview(URL.createObjectURL(fl));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setServerError(null);
    try {
      const user = await register({
        email: f.email.trim(),
        password: f.password,
        passwordConfirm: f.passwordConfirm,
        nickname: f.nickname.trim(),
        profileFile: file,
      });
      toast.success(`${user.nickname}님의 첫 책장이 준비됐어요!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const fe = (k) => errors[k] || serverError?.fields?.[k];

  return (
    <AuthWindow title="북모먼트 회원가입" tone="green">
      <h1 className="text-[26px]">나만의 책장 만들기</h1>
      <p className="mt-1 mb-6 text-[14px] text-ink-soft">오늘 읽은 한 페이지가 나만의 책장이 됩니다.</p>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <FormError message={serverError && !Object.keys(serverError.fields || {}).length ? serverError.message : null} />

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border-[1.5px] border-dashed border-kraft-deep bg-milk text-ink-soft transition hover:bg-kraft/50"
              aria-label="프로필 이미지 선택 (선택 사항)"
            >
              {preview ? <img src={preview} alt="프로필 미리보기" className="h-full w-full object-cover" /> : <Camera size={22} />}
            </button>
            {preview && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                aria-label="프로필 이미지 지우기"
                className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full border border-ink/40 bg-paper"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className="text-[13px] text-ink-soft">
            <p className="font-semibold text-ink">프로필 이미지 (선택)</p>
            <p>jpg · png · webp · gif, 5MB 이하</p>
            {errors.profile && <p className="font-medium text-berry">{errors.profile}</p>}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} tabIndex={-1} />
        </div>

        <Field label="이메일" required error={fe('email')}>
          <Input type="email" autoComplete="email" value={f.email} onChange={set('email')} placeholder="you@example.com" />
        </Field>
        <Field label="닉네임" required error={fe('nickname')} hint="2~20자, 다른 사람에게 보여지는 이름이에요">
          <Input autoComplete="nickname" value={f.nickname} onChange={set('nickname')} maxLength={20} placeholder="책읽는토끼" />
        </Field>
        <Field label="비밀번호" required error={fe('password')} hint="8자 이상, 영문과 숫자 포함">
          <Input type="password" autoComplete="new-password" value={f.password} onChange={set('password')} />
        </Field>
        <Field label="비밀번호 확인" required error={fe('passwordConfirm')}>
          <Input type="password" autoComplete="new-password" value={f.passwordConfirm} onChange={set('passwordConfirm')} />
        </Field>
        <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
          가입하고 책장 만들기
        </Button>
      </form>
      <p className="mt-6 text-center text-[13.5px] text-ink-soft">
        이미 계정이 있나요?{' '}
        <Link to="/login" className="font-semibold text-link underline underline-offset-4">
          로그인
        </Link>
      </p>
    </AuthWindow>
  );
}
