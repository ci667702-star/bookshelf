import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Ticket } from 'lucide-react';
import { sharedApi } from '../services/index.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import Button from '../components/ui/Button.jsx';
import { EmptyState, QueryState } from '../components/ui/States.jsx';
import { SharedShelfCard, ShelfFormModal } from '../components/shelf/ShelfParts.jsx';

function JoinCard() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const join = useMutation({
    mutationFn: () => sharedApi.join(code),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['shared'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`「${res.shelf.name}」에 참여했어요!`);
      navigate(`/shared/${res.shelf.id}`);
    },
    onError: (e) => {
      if (e.status === 409 && e.fields?.sharedBookshelfId) {
        toast.info('이미 참여 중인 책장이라 바로 열어 드릴게요.');
        navigate(`/shared/${e.fields.sharedBookshelfId}`);
        return;
      }
      setError(e.message);
    },
  });

  const submit = (e) => {
    e.preventDefault();
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length !== 8) return setError('초대 코드는 8자리예요.');
    setError('');
    join.mutate();
  };

  return (
    <form onSubmit={submit} className="relative overflow-hidden rounded-[8px] border-[1.5px] border-dashed border-ink/40 bg-butter p-5 sm:p-6">
      <span className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full bg-milk" aria-hidden />
      <span className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full bg-milk" aria-hidden />
      <h2 className="flex items-center gap-2 text-[19px]">
        <Ticket size={20} /> 초대 코드로 참여하기
      </h2>
      <p className="mt-1 text-[13px] text-ink/70">친구에게 받은 8자리 코드를 입력해 주세요.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="invite-code" className="sr-only">
          초대 코드
        </label>
        <input
          id="invite-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 12))}
          placeholder="예: BOOKCLUB"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? 'true' : undefined}
          className="field h-12 flex-1 text-center text-[20px] font-bold tracking-[0.3em] uppercase tabular-nums"
        />
        <Button type="submit" size="lg" loading={join.isPending}>
          참여하기
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] font-semibold text-berry">
          {error}
        </p>
      )}
    </form>
  );
}

export default function SharedShelvesPage() {
  useDocumentTitle('공유 책장');
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const mine = useQuery({ queryKey: ['shared', 'list', 'mine'], queryFn: () => sharedApi.list('mine') });
  const explore = useQuery({ queryKey: ['shared', 'list', 'public'], queryFn: () => sharedApi.list('public') });

  const create = useMutation({
    mutationFn: sharedApi.create,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['shared'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`공유 책장을 만들었어요. 초대 코드: ${res.shelf.inviteCode}`);
      setCreating(false);
      navigate(`/shared/${res.shelf.id}`);
    },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px]">공유 책장</h1>
          <p className="mt-1 text-[14px] text-ink-soft">독서 모임 친구들과 한 책장에 함께 책을 꽂아요.</p>
        </div>
        <Button
          onClick={() => {
            create.reset();
            setCreating(true);
          }}
        >
          <Plus size={16} /> 공유 책장 만들기
        </Button>
      </div>

      <JoinCard />

      <section className="mt-10">
        <h2 className="mb-4 text-[21px]">참여 중인 공유 책장</h2>
        <QueryState query={mine}>
          {(data) =>
            data.items.length === 0 ? (
              <EmptyState sticker="cat" title="아직 참여한 공유 책장이 없어요" description="새로 만들어 친구에게 초대 코드를 보내 보세요." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.items.map((s) => (
                  <SharedShelfCard key={s.id} shelf={s} />
                ))}
              </div>
            )
          }
        </QueryState>
      </section>

      <section className="mt-10">
        <h2 className="text-[21px]">둘러보기</h2>
        <p className="mt-0.5 mb-4 text-[13.5px] text-ink-soft">누구나 볼 수 있게 공개된 공유 책장이에요. 참여는 초대 코드로만 할 수 있어요.</p>
        <QueryState query={explore}>
          {(data) =>
            data.items.length === 0 ? (
              <p className="rounded-[8px] bg-milk px-4 py-8 text-center text-[13.5px] text-ink-soft">공개된 공유 책장이 아직 없어요.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.items.map((s) => (
                  <SharedShelfCard key={s.id} shelf={s} />
                ))}
              </div>
            )
          }
        </QueryState>
      </section>

      <ShelfFormModal
        shared
        open={creating}
        onClose={() => setCreating(false)}
        title="공유 책장 만들기"
        onSubmit={(body) => create.mutate(body)}
        submitting={create.isPending}
        error={create.error}
      />
    </div>
  );
}
