import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookPlus, ImageDown, Palette, Pencil, Trash2 } from 'lucide-react';
import { ShareImageModal, ShelfShareCard } from '../components/share/ShareImage.jsx';
import { shelfApi } from '../services/index.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import Button from '../components/ui/Button.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { QueryState } from '../components/ui/States.jsx';
import { Avatar, PrivacyBadge, Segmented, StarRating, StatusBadge } from '../components/ui/Misc.jsx';
import { Select } from '../components/ui/Field.jsx';
import ShelfScene from '../components/book/ShelfScene.jsx';
import BookCover from '../components/book/BookCover.jsx';
import { ReviewCard } from '../components/review/ReviewParts.jsx';
import { ShelfFormModal } from '../components/shelf/ShelfParts.jsx';
import { STATUS, STATUS_KEYS } from '../utils/constants.js';
import { formatDay, num, progressPct } from '../utils/format.js';

function ShelfBody({ data }) {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const { shelf, isOwner, records, decoration, stats, reviews } = data;
  const [status, setStatus] = useState('ALL');
  const [view, setView] = useState('shelf');
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moveTo, setMoveTo] = useState('');
  const [sharing, setSharing] = useState(false);
  useDocumentTitle(shelf.name);

  const myShelves = useQuery({
    queryKey: ['shelves', 'mine'],
    queryFn: () => shelfApi.list({ scope: 'mine' }),
    enabled: isOwner,
  });
  const others = (myShelves.data?.items ?? []).filter((s) => s.id !== shelf.id);

  const update = useMutation({
    mutationFn: (body) => shelfApi.update(shelf.id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shelves'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('책장 정보를 저장했어요.');
      setEditing(false);
    },
  });
  const remove = useMutation({
    mutationFn: () => shelfApi.remove(shelf.id, moveTo || others[0]?.id),
    onSuccess: (res) => {
      qc.invalidateQueries();
      toast.success(`책장을 삭제했어요. 책 ${res.movedCount}권은 「${res.movedTo.name}」으로 옮겼어요.`);
      navigate('/shelves');
    },
    onError: (e) => toast.error(e),
  });

  const filtered = useMemo(
    () => (status === 'ALL' ? records : records.filter((r) => r.status === status)),
    [records, status]
  );
  const counts = useMemo(() => {
    const c = { ALL: records.length };
    STATUS_KEYS.forEach((k) => (c[k] = records.filter((r) => r.status === k).length));
    return c;
  }, [records]);

  return (
    <div>
      <Link to={isOwner ? '/shelves' : `/users/${shelf.owner.id}`} className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={15} /> {isOwner ? '나의 책장' : `${shelf.owner.nickname}님의 프로필`}
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] sm:text-[26px]">{shelf.name}</h1>
            <PrivacyBadge isPublic={shelf.isPublic} />
          </div>
          {shelf.description && <p className="mt-1 max-w-2xl text-[14.5px] text-ink-soft">{shelf.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-soft">
            {!isOwner && (
              <Link to={`/users/${shelf.owner.id}`} className="flex items-center gap-1.5 font-semibold text-ink hover:underline">
                <Avatar user={shelf.owner} size={22} /> {shelf.owner.nickname}
              </Link>
            )}
            <span>책 {stats.books}권</span>
            <span>완독 {stats.finished}권</span>
            <span>
              {num(stats.pages)}쪽 · <b className="text-ink">{stats.heightCm}cm</b>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="soft" onClick={() => setSharing(true)}>
            <ImageDown size={15} /> 이미지로 저장
          </Button>
        {isOwner && (
          <div className="flex flex-wrap gap-2">
            <Button to="/books/new" size="sm" state={{ shelfId: shelf.id }}>
              <BookPlus size={15} /> 책 꽂기
            </Button>
            <Button to={`/decorate/${shelf.id}`} size="sm" variant="secondary">
              <Palette size={15} /> 꾸미기
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                update.reset();
                setEditing(true);
              }}
            >
              <Pencil size={14} /> 정보 수정
            </Button>
            <Button size="sm" variant="danger-ghost" onClick={() => setDeleting(true)} aria-label="책장 삭제">
              <Trash2 size={15} />
            </Button>
          </div>
        )}
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {view !== 'reviews' ? <Segmented
          label="독서 상태 필터"
          size="sm"
          value={status}
          onChange={setStatus}
          options={[{ value: 'ALL', label: '전체', count: counts.ALL }, ...STATUS_KEYS.map((k) => ({ value: k, label: STATUS[k].label, count: counts[k] }))]}
        /> : <span />}
        <Segmented
          label="보기 방식"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: 'shelf', label: '책장' },
            { value: 'list', label: '목록' },
            { value: 'reviews', label: `독후감 ${reviews.length}` },
          ]}
        />
      </div>

      {view === 'reviews' ? (
        reviews.length === 0 ? (
          <p className="py-10 text-center text-[13.5px] text-ink-soft">
            {isOwner ? '이 책장의 책으로 쓴 독후감이 아직 없어요.' : '공개된 독후감이 없어요.'}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )
      ) : view === 'shelf' ? (
        <ShelfScene
          records={filtered}
          decoration={decoration}
          emptyMessage={
            records.length === 0 ? (
              <div className="flex flex-col items-center gap-2">
                <p className="font-serif text-[16px]">아직 꽂힌 책이 없어요</p>
                {isOwner && (
                  <Button to="/books/new" size="sm" state={{ shelfId: shelf.id }}>
                    첫 책 꽂기
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-[14px]">이 상태의 책이 없어요.</p>
            )
          }
        />
      ) : filtered.length === 0 ? (
        <p className="card px-5 py-10 text-center text-[14px] text-ink-soft">해당하는 책이 없어요.</p>
      ) : (
        <ul className="card divide-y divide-kraft-deep/50">
          {filtered.map((r) => (
            <li key={r.id}>
              <Link to={`/books/${r.book.id}`} className="flex items-center gap-4 px-4 py-3 transition hover:bg-milk sm:px-5">
                <BookCover book={r.book} className="h-[72px] w-[50px] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-[15.5px] font-bold">{r.book.title}</p>
                  <p className="truncate text-[12.5px] text-ink-soft">
                    {r.book.author}
                    {r.book.publisher ? ` / ${r.book.publisher}` : ''}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    <StarRating value={r.rating} size={12} />
                    <span className="text-[12px] text-ink-soft">
                      {r.startDate ? formatDay(r.startDate) : ''}
                      {r.finishDate ? ` ~ ${formatDay(r.finishDate)}` : r.startDate && r.status === 'READING' ? ' ~' : ''}
                    </span>
                  </div>
                </div>
                <span className="hidden shrink-0 text-right text-[12.5px] text-ink-soft sm:block">
                  <span className="numeral block text-[20px] text-ink">{progressPct(r)}%</span>
                  {r.status === 'FINISHED' ? r.book.totalPages : r.currentPage}/{r.book.totalPages}쪽
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}


      <ShareImageModal open={sharing} onClose={() => setSharing(false)} title="책장 이미지로 저장" filename={`bookmoment-${shelf.name}`}>
        <ShelfShareCard shelf={shelf} owner={shelf.owner} records={records} decoration={decoration} stats={stats} />
      </ShareImageModal>
      {isOwner && (
        <>
          <ShelfFormModal
            open={editing}
            onClose={() => setEditing(false)}
            title="책장 정보 수정"
            initial={shelf}
            onSubmit={(body) => update.mutate(body)}
            submitting={update.isPending}
            error={update.error}
          />
          <ConfirmDialog
            open={deleting}
            onClose={() => setDeleting(false)}
            onConfirm={() => remove.mutate()}
            loading={remove.isPending}
            title="책장 삭제"
            confirmLabel="책장 삭제"
            message={
              others.length === 0 ? (
                <p>책장은 최소 1개가 있어야 해요. 다른 책장을 먼저 만든 뒤 삭제해 주세요.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <p>
                    「{shelf.name}」 책장을 삭제할까요? 꽂혀 있던 책 {records.length}권과 독서 기록은 지워지지 않고 아래 책장으로 옮겨져요.
                  </p>
                  <label className="text-[13px] font-semibold" htmlFor="move-to">
                    옮길 책장
                  </label>
                  <Select id="move-to" value={moveTo || others[0]?.id} onChange={(e) => setMoveTo(e.target.value)}>
                    {others.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )
            }
          />
        </>
      )}
    </div>
  );
}

export default function ShelfDetailPage() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ['shelves', id], queryFn: () => shelfApi.get(id) });
  return <QueryState query={q}>{(data) => <ShelfBody data={data} />}</QueryState>;
}
