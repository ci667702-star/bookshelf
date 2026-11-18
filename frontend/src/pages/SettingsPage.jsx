import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { userApi } from '../services/index.js';
import { resetUserCache, useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Field, Input, Textarea, FormError } from '../components/ui/Field.jsx';
import { Avatar, Segmented } from '../components/ui/Misc.jsx';
import ImageUpload from '../components/ui/ImageUpload.jsx';

function Section({ id, title, description, children }) {
  return (
    <section id={id} className="card grid gap-5 p-4 sm:p-6 md:grid-cols-[200px_1fr]">
      <div>
        <h2 className="text-[19px]">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-ink-soft">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function ProfileForm() {
  const { user, refresh } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [f, setF] = useState({ nickname: user.nickname, bio: user.bio ?? '', profileImage: user.profileImage ?? null });
  const m = useMutation({
    mutationFn: () => userApi.updateMe({ nickname: f.nickname.trim(), bio: f.bio.trim() || null, profileImage: f.profileImage }),
    onSuccess: () => {
      refresh();
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('프로필을 저장했어요.');
    },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        m.mutate();
      }}
      className="grid gap-5 sm:grid-cols-[150px_1fr]"
    >
      <div>
        <ImageUpload
          label="프로필 이미지"
          aspect="aspect-square"
          allowUrl={false}
          value={f.profileImage}
          onChange={(v) => setF({ ...f, profileImage: v })}
          preview={!f.profileImage ? <div className="grid h-full place-items-center"><Avatar user={{ ...user, profileImage: null }} size={88} /></div> : undefined}
        />
      </div>
      <div className="flex flex-col gap-4">
        <FormError message={m.error && !Object.keys(m.error.fields || {}).length ? m.error.message : null} />
        <Field label="닉네임" required error={m.error?.fields?.nickname} hint="2~20자, 한글 · 영문 · 숫자 · _ . -">
          <Input value={f.nickname} maxLength={20} onChange={(e) => setF({ ...f, nickname: e.target.value })} />
        </Field>
        <Field label="소개" error={m.error?.fields?.bio} hint={`${f.bio.length}/160`}>
          <Textarea value={f.bio} maxLength={160} rows={3} className="min-h-20" onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder="어떤 책을 좋아하나요?" />
        </Field>
        <div>
          <Button type="submit" loading={m.isPending}>
            프로필 저장
          </Button>
        </div>
      </div>
    </form>
  );
}

function GoalForm() {
  const { user, refresh } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [f, setF] = useState({ yearlyGoalBooks: String(user.yearlyGoalBooks), monthlyGoalPages: String(user.monthlyGoalPages) });
  const m = useMutation({
    mutationFn: () => userApi.updateMe({ yearlyGoalBooks: Number(f.yearlyGoalBooks), monthlyGoalPages: Number(f.monthlyGoalPages) }),
    onSuccess: () => {
      refresh();
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['marathon'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('독서 목표를 저장했어요.');
    },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        m.mutate();
      }}
      className="flex flex-col gap-4"
    >
      <FormError message={m.error && !Object.keys(m.error.fields || {}).length ? m.error.message : null} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="올해 완독 목표 (권)" error={m.error?.fields?.yearlyGoalBooks}>
          <Input type="number" min={1} max={365} value={f.yearlyGoalBooks} onChange={(e) => setF({ ...f, yearlyGoalBooks: e.target.value })} />
        </Field>
        <Field label="한 달 페이지 목표 (쪽)" error={m.error?.fields?.monthlyGoalPages} hint={`${(Number(f.monthlyGoalPages) * 0.01 || 0).toFixed(1)}cm 만큼`}>
          <Input type="number" min={10} max={100000} value={f.monthlyGoalPages} onChange={(e) => setF({ ...f, monthlyGoalPages: e.target.value })} />
        </Field>
      </div>
      <div>
        <Button type="submit" loading={m.isPending}>
          목표 저장
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const toast = useToast();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
  const [local, setLocal] = useState({});
  const m = useMutation({
    mutationFn: () => userApi.changePassword(f),
    onSuccess: () => {
      setF({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
      toast.success('비밀번호를 바꿨어요. 다른 기기에서는 다시 로그인해야 해요.');
    },
  });
  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!f.currentPassword) errs.currentPassword = '현재 비밀번호를 입력해 주세요.';
    if (f.newPassword.length < 8 || !/[A-Za-z]/.test(f.newPassword) || !/[0-9]/.test(f.newPassword)) errs.newPassword = '8자 이상, 영문과 숫자를 포함해 주세요.';
    if (f.newPassword !== f.newPasswordConfirm) errs.newPasswordConfirm = '새 비밀번호가 서로 달라요.';
    setLocal(errs);
    if (!Object.keys(errs).length) m.mutate();
  };
  const err = (k) => local[k] || m.error?.fields?.[k];
  return (
    <form onSubmit={submit} noValidate className="flex max-w-md flex-col gap-4">
      <FormError message={m.error && !Object.keys(m.error.fields || {}).length ? m.error.message : null} />
      <Field label="현재 비밀번호" error={err('currentPassword')}>
        <Input type="password" autoComplete="current-password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} />
      </Field>
      <Field label="새 비밀번호" error={err('newPassword')} hint="8자 이상, 영문과 숫자 포함">
        <Input type="password" autoComplete="new-password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} />
      </Field>
      <Field label="새 비밀번호 확인" error={err('newPasswordConfirm')}>
        <Input type="password" autoComplete="new-password" value={f.newPasswordConfirm} onChange={(e) => setF({ ...f, newPasswordConfirm: e.target.value })} />
      </Field>
      <div>
        <Button type="submit" loading={m.isPending}>
          비밀번호 바꾸기
        </Button>
      </div>
    </form>
  );
}

function DangerZone() {
  const { logout } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const m = useMutation({
    mutationFn: () => userApi.deleteMe(password),
    onSuccess: () => {
      resetUserCache(qc, null);
      toast.success('탈퇴했어요. 그동안 함께해 주셔서 고마워요.');
      navigate('/', { replace: true });
    },
  });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            await logout();
            toast.success('로그아웃했어요.');
            navigate('/');
          }}
        >
          <LogOut size={15} /> 로그아웃
        </Button>
        <Button variant="danger-ghost" onClick={() => setOpen(true)}>
          회원 탈퇴
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="회원 탈퇴"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button variant="danger" loading={m.isPending} disabled={!password} onClick={() => m.mutate()}>
              영구 삭제
            </Button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed">
          책장, 책, 독서 기록, 독후감, 댓글, 내가 만든 공유 책장이 모두 <b>영구 삭제</b>되고 되돌릴 수 없어요. 계속하려면 비밀번호를 입력해 주세요.
        </p>
        <div className="mt-4">
          <FormError message={m.error?.message} />
          <Field label="비밀번호" className="mt-2">
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

const SETTING_TABS = [
  { value: 'profile', label: '프로필' },
  { value: 'goals', label: '독서 목표' },
  { value: 'password', label: '비밀번호' },
  { value: 'account', label: '계정' },
];

export default function SettingsPage() {
  useDocumentTitle('설정');
  const [params, setParams] = useSearchParams();
  const tab = SETTING_TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'profile';
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[22px]">설정</h1>
        <p className="mt-1 text-[13.5px] text-ink-soft">프로필, 독서 목표, 계정을 관리해요.</p>
      </div>
      <Segmented label="설정 항목" value={tab} onChange={(v) => setParams({ tab: v })} options={SETTING_TABS} />
      {tab === 'profile' && (
        <Section title="프로필" description="다른 사람에게 보여지는 이름과 사진이에요.">
          <ProfileForm />
        </Section>
      )}
      {tab === 'goals' && (
        <Section title="독서 목표" description="홈 · 달력 · 마라톤의 달성률에 쓰여요.">
          <GoalForm />
        </Section>
      )}
      {tab === 'password' && (
        <Section title="비밀번호" description="바꾸면 다른 기기의 로그인은 모두 끊겨요.">
          <PasswordForm />
        </Section>
      )}
      {tab === 'account' && (
        <Section title="계정" description="로그아웃하거나 계정을 삭제해요.">
          <DangerZone />
        </Section>
      )}
    </div>
  );
}
