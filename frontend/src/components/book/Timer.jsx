import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Square, Timer as TimerIcon, X } from 'lucide-react';
import { timerApi } from '../../services/index.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Input, FormError } from '../ui/Field.jsx';
import { Segmented } from '../ui/Misc.jsx';

export function useTimer() {
  return useQuery({ queryKey: ['timer'], queryFn: timerApi.get, staleTime: 30 * 1000 });
}

function useElapsed(startedAt) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
}

export function formatElapsed(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** 책 화면 · 홈에서 쓰는 '타이머 시작' 버튼 */
export function StartTimerButton({ record, size = 'md', variant = 'green', label = '타이머 시작' }) {
  const qc = useQueryClient();
  const toast = useToast();
  const m = useMutation({
    mutationFn: () => timerApi.start(record.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timer'] });
      toast.info(`「${record.book.title}」 독서 타이머를 시작했어요.`);
    },
    onError: (e) => toast.error(e),
  });
  return (
    <Button
      size={size}
      variant={variant}
      onClick={() => m.mutate()}
      loading={m.isPending}
      aria-label={label ? undefined : `「${record.book.title}」 타이머 시작`}
      title={label ? undefined : '타이머 시작'}
    >
      <TimerIcon size={15} /> {label}
    </Button>
  );
}

function StopModal({ open, onClose, session, elapsed }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [mode, setMode] = useState('pages');
  const [value, setValue] = useState('');
  const [memo, setMemo] = useState('');
  const record = session?.record;
  const base = record ? (record.status === 'WANT_TO_READ' ? 0 : record.currentPage) : 0;
  const total = record?.book?.totalPages ?? 0;

  useEffect(() => {
    if (open) {
      setValue('');
      setMemo('');
    }
  }, [open]);

  const stop = useMutation({
    mutationFn: () =>
      timerApi.stop({
        ...(value ? (mode === 'pages' ? { pagesRead: Number(value) } : { toPage: Number(value) }) : {}),
        memo: memo.trim() || null,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries();
      toast.success(
        res.finished
          ? `완독을 축하해요! ${res.minutes}분 동안 읽었어요.`
          : `${res.minutes}분 동안 ${res.log.pagesRead}쪽 읽었어요. 달력에 남겼어요.`
      );
      onClose();
    },
  });

  if (!session) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="독서 타이머 멈추기"
      tone="green"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            계속 읽기
          </Button>
          <Button onClick={() => stop.mutate()} loading={stop.isPending}>
            기록하고 멈추기
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormError message={stop.error?.message} />
        <p className="rounded-[8px] border-[1.5px] border-ink/30 bg-milk px-4 py-3 text-[13.5px]">
          <b className="font-pixel">「{record.book.title}」</b>을(를) <b className="numeral text-[16px]">{formatElapsed(elapsed)}</b> 동안 읽었어요.
          <br />
          지금까지 {base} / {total}쪽
        </p>
        <Segmented
          label="입력 방식"
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'pages', label: '읽은 쪽수' },
            { value: 'toPage', label: '몇 쪽까지 읽었나' },
          ]}
        />
        <Field label={mode === 'pages' ? '이번에 읽은 쪽수' : '읽은 곳 (페이지)'} hint="비워 두면 읽은 시간만 기록해요">
          <Input type="number" inputMode="numeric" min={1} value={value} onChange={(e) => setValue(e.target.value)} placeholder={mode === 'pages' ? '예: 25' : `${base + 1} ~ ${total}`} />
        </Field>
        <Field label="한 줄 메모 (선택)">
          <Input value={memo} maxLength={200} onChange={(e) => setMemo(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/** 화면 아래(탭 바 위)에 떠 있는 진행 중 타이머 */
export function TimerBar() {
  const q = useTimer();
  const qc = useQueryClient();
  const toast = useToast();
  const session = q.data?.session;
  const elapsed = useElapsed(session?.startedAt);
  const [stopping, setStopping] = useState(false);
  const cancel = useMutation({
    mutationFn: timerApi.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timer'] });
      toast.info('타이머를 기록 없이 껐어요.');
    },
  });

  if (!session) return null;
  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-3" role="status" aria-live="off">
        <div className="flex w-full max-w-md items-center gap-2 rounded-[8px] border-[1.5px] border-ink/85 bg-lime px-3 py-2 shadow-[3px_3px_0_rgba(81,68,61,0.85)]">
          <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-ink/85 bg-paper">
            <TimerIcon size={16} />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 animate-pulse rounded-full border border-paper bg-pin" aria-hidden />
          </span>
          <Link to={`/books/${session.record.book.id}`} className="min-w-0 flex-1">
            <span className="block truncate text-[12px] text-ink/70">「{session.record.book.title}」 읽는 중</span>
            <span className="numeral block text-[18px] leading-tight" aria-label={`경과 시간 ${formatElapsed(elapsed)}`}>
              {formatElapsed(elapsed)}
            </span>
          </Link>
          <Button size="xs" onClick={() => setStopping(true)}>
            <Square size={12} /> 멈추기
          </Button>
          <button
            onClick={() => cancel.mutate()}
            aria-label="기록하지 않고 타이머 끄기"
            title="기록하지 않고 끄기"
            className="grid h-7 w-7 place-items-center rounded-[4px] text-ink/60 hover:bg-paper/60 hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>
      </div>
      <StopModal open={stopping} onClose={() => setStopping(false)} session={session} elapsed={elapsed} />
    </>
  );
}
