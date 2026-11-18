import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookPlus, Check, Copy, Crown, DoorOpen, Pencil, PenLine, RefreshCw, Trash2, UserMinus, X } from 'lucide-react';
import { readingApi, sharedApi } from '../services/index.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import Button from '../components/ui/Button.jsx';
import Modal, { ConfirmDialog } from '../components/ui/Modal.jsx';
import { QueryState, EmptyState, Spinner } from '../components/ui/States.jsx';
import { Avatar, PrivacyBadge, Segmented, StatusBadge } from '../components/ui/Misc.jsx';
import ShelfScene from '../components/book/ShelfScene.jsx';
import BookCover from '../components/book/BookCover.jsx';
import { ReviewCard } from '../components/review/ReviewParts.jsx';
import { ShelfFormModal } from '../components/shelf/ShelfParts.jsx';
import { formatDateTime, num } from '../utils/format.js';

function InviteCode({ shelf, isOwner }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const regen = useMutation({
    mutationFn: () => sharedApi.regenerateCode(shelf.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shared', shelf.id] });
      toast.success('새 초대 코드를 만들었어요. 이전 코드는 더 이상 쓸 수 없어요.');
    },
    onError: (e) => toast.error(e),
  });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shelf.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('복사하지 못했어요. 코드를 직접 선택해 복사해 주세요.');
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[8px] border-[1.5px] border-dashed border-ink/35 bg-butter px-4 py-3">
      <span className="text-[12.5px] font-semibold text-ink/70">초대 코드</span>
      <code className="font-sans text-[20px] font-bold tracking-[0.28em] select-all">{shelf.inviteCode}</code>
      <div className="ml-auto flex gap-1.5">
        <Button size="xs" variant="outline" onClick={copy}>
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? '복사됨' : '복사'}
        </Button>
        {isOwner && (
          <Button size="xs" variant="ghost" onClick={() => regen.mutate()} loading={regen.isPending}>
            <RefreshCw size={13} /> 새 코드
          </Button>
        )}
      </div>
    </div>
  );
}

function AddBookModal({ open, onClose, shelfId, existingRecordIds }) {
  const qc = useQueryClient();
  const toast = useToast();
  const mine = useQuery({ queryKey: ['reading', 'all'], queryFn: () => readingApi.list(), enabled: open });
  const add = useMutation({
    mutationFn: (recordId) => sharedApi.addItem(shelfId, recordId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['shared'] });
      toast.success(`「${res.item.record.book.title}」을(를) 꽂았어요.`);
    },
    onError: (e) => toast.error(e),
  });
  const candidates = (mine.data?.items ?? []).filter((r) => !existingRecordIds.has(r.id));
  return (
    <Modal open={open} onClose={onClose} title="공유 책장에 책 꽂기" tone="green" size="lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[8px] bg-milk px-4 py-3 text-[13.5px]">
        <span>내 책장에 없는 새 책인가요?</span>
        <Button size="sm" variant="secondary" to={`/books/new?shared=${shelfId}`}>
          <BookPlus size={14} /> 새 책 등록하고 꽂기
        </Button>
      </div>
      {mine.isPending ? (
        <div className="grid place-items-center py-10">
          <Spinner />
        </div>
      ) : mine.isError ? (
        <p className="text-berry">{mine.error.message}</p>
      ) : candidates.length === 0 ? (
        <p className="py-8 text-center text-[13.5px] text-ink-soft">꽂을 수 있는 내 책이 없어요. 모두 이미 꽂혀 있거나 아직 등록한 책이 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {candidates.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-[8px] bg-milk p-2.5">
              <BookCover book={r.book} className="h-14 w-10 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif text-[14.5px] font-bold">{r.book.title}</span>
                <span className="block truncate text-[12px] text-ink-soft">{r.book.author}</span>
              </span>
              <StatusBadge status={r.status} className="hidden sm:inline-flex" />
              <Button size="xs" onClick={() => add.mutate(r.id)} loading={add.isPending && add.variables === r.id}>
                꽂기
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

/** 참여자별 독서량: 단일 계열 가로 막대 (값은 본문 잉크색, 막대는 한 가지 색) */
function MemberBars({ members, metric }) {
  const max = Math.max(1, ...members.map((m) => m.stats[metric]));
  const unit = metric === 'pages' ? '쪽' : '권';
  const sorted = [...members].sort((a, b) => b.stats[metric] - a.stats[metric]);
  return (
    <ul className="flex flex-col gap-3" aria-label="참여자별 독서량">
      {sorted.map((m) => {
        const v = m.stats[metric];
        return (
          <li key={m.user.id} className="grid grid-cols-[96px_1fr_auto] items-center gap-3 sm:grid-cols-[130px_1fr_auto]" title={`${m.user.nickname}: ${num(v)}${unit}`}>
            <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold">
              <Avatar user={m.user} size={22} />
              <span className="truncate">{m.user.nickname}</span>
            </span>
            <span className="h-5 rounded-[4px] bg-kraft/60">
              <span
                className="block h-full rounded-[4px] bg-cocoa transition-[width] duration-500"
                style={{ width: `${(v / max) * 100}%`, minWidth: v > 0 ? 4 : 0 }}
              />
            </span>
            <span className="w-16 text-right text-[13px] font-semibold tabular-nums">
              {num(v)}
              <span className="text-ink-soft">{unit}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Body({ data }) {
  const { shelf, isMember, isOwner, members, items, reviews, stats } = data;
  useDocumentTitle(shelf.name);
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('shelf');
  const [metric, setMetric] = useState('pages');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type, payload }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['shared'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const update = useMutation({
    mutationFn: (body) => sharedApi.update(shelf.id, body),
    onSuccess: () => {
      invalidate();
      toast.success('공유 책장 정보를 저장했어요.');
      setEditing(false);
    },
  });
  const action = useMutation({
    mutationFn: ({ type, payload }) => {
      if (type === 'leave') return sharedApi.leave(shelf.id);
      if (type === 'delete') return sharedApi.remove(shelf.id);
      if (type === 'kick') return sharedApi.removeMember(shelf.id, payload.user.id);
      if (type === 'removeItem') return sharedApi.removeItem(shelf.id, payload.id);
      return null;
    },
    onSuccess: (_, { type, payload }) => {
      invalidate();
      setConfirm(null);
      if (type === 'leave') {
        toast.success('공유 책장에서 나왔어요.');
        navigate('/shared');
      } else if (type === 'delete') {
        toast.success('공유 책장을 삭제했어요.');
        navigate('/shared');
      } else if (type === 'kick') toast.success(`${payload.user.nickname}님을 내보냈어요.`);
      else toast.success('책을 공유 책장에서 뺐어요.');
    },
    onError: (e) => toast.error(e),
  });

  const records = useMemo(() => items.map((i) => ({ ...i.record, id: i.id })), [items]);
  const existingRecordIds = useMemo(() => new Set(items.map((i) => i.record.id)), [items]);
  const decoration = { theme: 'forest', layout: { shelfStyle: 'wood', arrangement: 'spine' }, decorations: [] };

  const confirmText = {
    leave: { title: '공유 책장 나가기', label: '나가기', msg: '이 공유 책장에서 나갈까요? 내가 꽂은 책은 이 책장에서 빠지고(내 책장에는 그대로 있어요), 공유 독후감은 내 독후감으로만 남아요.' },
    delete: { title: '공유 책장 삭제', label: '삭제', msg: '공유 책장을 삭제할까요? 참여자 모두 이 책장을 볼 수 없게 돼요. 각자의 책과 독후감은 개인 책장에 남아요.' },
    kick: { title: '참여자 내보내기', label: '내보내기', msg: `${confirm?.payload?.user?.nickname}님을 내보낼까요? 이 사람이 꽂은 책도 이 책장에서 빠져요.` },
    removeItem: { title: '책 빼기', label: '빼기', msg: `「${confirm?.payload?.record?.book?.title}」을(를) 공유 책장에서 뺄까요? 책 자체와 독서 기록은 지워지지 않아요.` },
  }[confirm?.type ?? 'leave'];

  return (
    <div>
      <Link to="/shared" className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={15} /> 공유 책장
      </Link>

      <header className="card mb-5 overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-7">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-matcha">
            {shelf.coverImage ? <img src={shelf.coverImage} alt="" className="h-full w-full object-cover" /> : <span className="wordmark text-[40px] text-matcha-deep">{shelf.name.slice(0, 1)}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[21px] sm:text-[24px]">{shelf.name}</h1>
              <PrivacyBadge isPublic={shelf.isPublic} />
            </div>
            {shelf.description && <p className="mt-1 text-[14.5px] text-ink-soft">{shelf.description}</p>}
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-soft">
              <span className="flex items-center gap-1">
                <Crown size={13} className="text-[#C79A2E]" /> {shelf.owner.nickname}
              </span>
              <span>참여자 {members.length}명</span>
              <span>{formatDateTime(shelf.createdAt)} 시작</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            {isMember && (
              <Button size="sm" onClick={() => setAdding(true)}>
                <BookPlus size={15} /> 책 꽂기
              </Button>
            )}
            {isMember && (
              <Button size="sm" variant="secondary" to={`/reviews/new?shared=${shelf.id}`}>
                <PenLine size={14} /> 공유 독후감
              </Button>
            )}
            {isOwner && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    update.reset();
                    setEditing(true);
                  }}
                >
                  <Pencil size={14} /> 수정
                </Button>
                <Button size="sm" variant="danger-ghost" onClick={() => setConfirm({ type: 'delete' })} aria-label="공유 책장 삭제">
                  <Trash2 size={15} />
                </Button>
              </>
            )}
            {isMember && !isOwner && (
              <Button size="sm" variant="ghost" onClick={() => setConfirm({ type: 'leave' })}>
                <DoorOpen size={15} /> 나가기
              </Button>
            )}
          </div>
        </div>
        {isMember ? (
          <div className="border-t border-kraft-deep/50 bg-milk/60 p-4 sm:px-7">
            <InviteCode shelf={shelf} isOwner={isOwner} />
          </div>
        ) : (
          <p className="border-t border-kraft-deep/50 bg-milk/60 px-5 py-3 text-[13px] text-ink-soft sm:px-7">
            공개된 공유 책장을 구경 중이에요. 참여하려면 참여자에게 초대 코드를 받아 주세요.
          </p>
        )}
      </header>


      <div className="mb-4">
        <Segmented
          label="공유 책장 보기"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'shelf', label: '책장', count: items.length },
            { value: 'members', label: '참여자', count: members.length },
            { value: 'reviews', label: '독후감', count: reviews.length },
            { value: 'stats', label: '통계' },
          ]}
        />
      </div>

      {tab === 'shelf' && (
        <div className="flex flex-col gap-5">
          <ShelfScene
            records={records}
            decoration={decoration}
            emptyMessage={
              <div className="flex flex-col items-center gap-2">
                <p className="font-serif text-[16px]">아직 함께 꽂은 책이 없어요</p>
                {isMember && (
                  <Button size="sm" onClick={() => setAdding(true)}>
                    첫 책 꽂기
                  </Button>
                )}
              </div>
            }
          />
          {items.length > 0 && (
            <ul className="card divide-y divide-kraft-deep/50">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <Link to={`/books/${i.record.book.id}`} className="shrink-0">
                    <BookCover book={i.record.book} className="h-14 w-10" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/books/${i.record.book.id}`} className="block truncate font-serif text-[15px] font-bold hover:underline">
                      {i.record.book.title}
                    </Link>
                    <p className="flex items-center gap-1.5 text-[12.5px] text-ink-soft">
                      <Avatar user={i.addedBy} size={16} /> {i.addedBy.nickname}님이 꽂음
                    </p>
                  </div>
                  <StatusBadge status={i.record.status} className="hidden sm:inline-flex" />
                  {i.canRemove && (
                    <button
                      onClick={() => setConfirm({ type: 'removeItem', payload: i })}
                      aria-label={`${i.record.book.title} 공유 책장에서 빼기`}
                      className="rounded-full p-1.5 text-ink-soft transition hover:bg-rose hover:text-berry"
                    >
                      <X size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'members' && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[13.5px]">
            <caption className="sr-only">참여자별 독서 기록</caption>
            <thead>
              <tr className="border-b border-kraft-deep/60 text-[12px] text-ink-soft">
                <th className="px-5 py-3 font-semibold">참여자</th>
                <th className="px-3 py-3 text-right font-semibold">꽂은 책</th>
                <th className="px-3 py-3 text-right font-semibold">완독</th>
                <th className="px-3 py-3 text-right font-semibold">읽은 페이지</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.user.id} className="border-b border-kraft-deep/40 last:border-0">
                  <td className="px-5 py-3">
                    <Link to={`/users/${m.user.id}`} className="flex items-center gap-2.5 font-semibold hover:underline">
                      <Avatar user={m.user} size={32} />
                      {m.user.nickname}
                      {m.role === 'OWNER' && <Crown size={14} className="text-[#C79A2E]" aria-label="소유자" />}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{m.stats.books}권</td>
                  <td className="px-3 py-3 text-right tabular-nums">{m.stats.finished}권</td>
                  <td className="px-3 py-3 text-right tabular-nums">{num(m.stats.pages)}쪽</td>
                  <td className="px-5 py-3 text-right">
                    {isOwner && m.role !== 'OWNER' && (
                      <Button size="xs" variant="danger-ghost" onClick={() => setConfirm({ type: 'kick', payload: m })}>
                        <UserMinus size={13} /> 내보내기
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'reviews' &&
        (reviews.length === 0 ? (
          <EmptyState
            compact
            sticker="star"
            title="아직 공유 독후감이 없어요"
            action={isMember && <Button to={`/reviews/new?shared=${shelf.id}`} size="sm">공유 독후감 쓰기</Button>}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ))}

      {tab === 'stats' && (
        <>
      {/* 공동 통계 */}
      <section aria-label="공동 독서 통계" className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          ['함께 꽂은 책', stats.books, '권', 'bg-matcha'],
          ['그중 완독', stats.finished, '권', 'bg-rose'],
          ['함께 읽은 페이지', num(stats.pages), '쪽', 'bg-butter'],
          ['함께 쌓은 높이', stats.heightCm, 'cm', 'bg-sky'],
        ].map(([label, v, u, tone]) => (
          <div key={label} className={`tile ${tone} p-4`}>
            <p className="text-[12.5px] font-semibold text-ink/70">{label}</p>
            <p className="flex items-baseline gap-1">
              <span className="numeral text-[30px] leading-tight">{v}</span>
              <span className="text-[12.5px] font-bold">{u}</span>
            </p>
          </div>
        ))}
      </section>
        <section className="card p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[19px]">참여자별 독서량</h2>
            <Segmented
              label="기준"
              size="sm"
              value={metric}
              onChange={setMetric}
              options={[
                { value: 'pages', label: '읽은 페이지' },
                { value: 'finished', label: '완독' },
                { value: 'books', label: '꽂은 책' },
              ]}
            />
          </div>
          <MemberBars members={members} metric={metric} />
          <p className="mt-4 text-[12px] text-ink-soft">각자 이 공유 책장에 꽂은 책 기준이에요. 자세한 숫자는 참여자 탭의 표에서 볼 수 있어요.</p>
        </section>
        </>
      )}

      {isMember && <AddBookModal open={adding} onClose={() => setAdding(false)} shelfId={shelf.id} existingRecordIds={existingRecordIds} />}
      {isOwner && (
        <ShelfFormModal
          shared
          open={editing}
          onClose={() => setEditing(false)}
          title="공유 책장 수정"
          initial={shelf}
          onSubmit={(body) => update.mutate(body)}
          submitting={update.isPending}
          error={update.error}
        />
      )}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => action.mutate(confirm)}
        loading={action.isPending}
        title={confirmText.title}
        confirmLabel={confirmText.label}
        message={<p>{confirmText.msg}</p>}
      />
    </div>
  );
}

export default function SharedShelfDetailPage() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ['shared', id], queryFn: () => sharedApi.get(id) });
  return <QueryState query={q}>{(data) => <Body data={data} />}</QueryState>;
}
