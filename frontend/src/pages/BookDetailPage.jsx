import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookMarked, Pencil, PenLine, Trash2, Users, X } from 'lucide-react';
import { bookApi, readingApi } from '../services/index.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import Button from '../components/ui/Button.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { QueryState } from '../components/ui/States.jsx';
import { Avatar, ProgressBar, Segmented, StarRating, StatusBadge } from '../components/ui/Misc.jsx';
import BookCover from '../components/book/BookCover.jsx';
import LogModal from '../components/book/LogModal.jsx';
import { ReviewCard } from '../components/review/ReviewParts.jsx';
import { formatDay, num, progressPct } from '../utils/format.js';

function Body({ data }) {
  const { book, record, isMine, owner, logs, reviews, sharedShelves } = data;
  useDocumentTitle(book.title);
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [logOpen, setLogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [tab, setTab] = useState(isMine ? 'logs' : 'reviews');

  const remove = useMutation({
    mutationFn: () => bookApi.remove(book.id),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success('책을 책장에서 뺐어요.');
      navigate('/shelves');
    },
    onError: (e) => toast.error(e),
  });
  const removeLog = useMutation({
    mutationFn: (logId) => readingApi.removeLog(logId),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success('기록을 지우고 페이지를 되돌렸어요.');
      setLogToDelete(null);
    },
    onError: (e) => toast.error(e),
  });

  const pct = record ? progressPct({ ...record, book }) : 0;
  const pagesDone = record ? (record.status === 'FINISHED' ? book.totalPages : record.currentPage) : 0;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={15} /> 뒤로
      </button>

      <article className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="mx-auto w-[200px] md:w-full">
          <div className="rotate-[-1.5deg] bg-white p-2.5 pb-8 shadow-[0_14px_28px_-14px_rgba(81,68,61,0.55)]">
            <BookCover book={book} className="aspect-[3/4] w-full" rounded="rounded-[2px]" shadow={false} />
            <p className="mt-2.5 text-center hand text-[14px] text-ink-soft">
              {record?.finishDate ? `${formatDay(record.finishDate)} 완독` : record?.startDate ? `${formatDay(record.startDate)}부터` : '읽고 싶은 책'}
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {record && <StatusBadge status={record.status} />}
            {record?.bookshelf && (
              <Link to={`/shelves/${record.bookshelf.id}`} className="inline-flex items-center gap-1 rounded-full bg-kraft px-2.5 py-0.5 text-[12px] font-semibold hover:bg-kraft-deep">
                <BookMarked size={12} /> {record.bookshelf.name}
              </Link>
            )}
            {sharedShelves.map((s) => (
              <Link key={s.id} to={`/shared/${s.id}`} className="inline-flex items-center gap-1 rounded-full bg-matcha px-2.5 py-0.5 text-[12px] font-semibold hover:brightness-95">
                <Users size={12} /> {s.name}
              </Link>
            ))}
          </div>
          <h1 className="mt-3 text-[22px] leading-tight sm:text-[26px]">{book.title}</h1>
          <p className="mt-1 text-[15px] text-ink-soft">
            {book.author}
            {book.publisher ? ` / ${book.publisher}` : ''}
            {` / ${num(book.totalPages)}쪽`}
          </p>
          {!isMine && (
            <Link to={`/users/${owner.id}`} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold hover:underline">
              <Avatar user={owner} size={24} /> {owner.nickname}님의 책장에서
            </Link>
          )}

          {record?.rating ? (
            <div className="mt-4">
              <StarRating value={record.rating} size={20} />
            </div>
          ) : null}

          {record?.oneLineReview && (
            <blockquote className="relative mt-5 rounded-[8px] border-[1.5px] border-ink/85 bg-rose/50 px-5 py-4 text-[15px] leading-relaxed">
              <span className="absolute -top-4 left-3 hand text-[44px] leading-none text-cocoa/60" aria-hidden>
                “
              </span>
              {record.oneLineReview}
            </blockquote>
          )}

          {record && record.status !== 'WANT_TO_READ' && (
            <div className="mt-6">
              <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                <span className="font-semibold">
                  {num(pagesDone)} / {num(book.totalPages)}쪽
                </span>
                <span className="text-ink-soft">
                  독서 마라톤 <b className="text-ink">{(record.countedPages * 0.01).toFixed(2)}cm</b>
                </span>
              </div>
              <ProgressBar value={pct} tone={record.status === 'FINISHED' ? 'bg-matcha-deep' : 'bg-cocoa'} label="읽은 비율" />
              <p className="mt-2 text-[12.5px] text-ink-soft">
                {record.startDate && `${formatDay(record.startDate, { withYear: true })} 시작`}
                {record.finishDate && ` · ${formatDay(record.finishDate, { withYear: true })} 완독`}
              </p>
            </div>
          )}

          {isMine && (
            <div className="mt-7 flex flex-wrap gap-2">
              {record && record.status !== 'FINISHED' && (
                <Button onClick={() => setLogOpen(true)}>
                  <BookMarked size={15} /> 오늘 읽은 페이지 기록
                </Button>
              )}
              <Button variant="secondary" to={`/reviews/new?bookId=${book.id}`}>
                <PenLine size={15} /> 독후감 쓰기
              </Button>
              <Button variant="outline" to={`/books/${book.id}/edit`}>
                <Pencil size={14} /> 수정
              </Button>
              <Button variant="danger-ghost" onClick={() => setDeleting(true)}>
                <Trash2 size={15} /> 삭제
              </Button>
            </div>
          )}
        </div>
      </article>

      <div className="mt-6">
        <div className="mb-4">
          <Segmented
            label="책 정보 보기"
            value={tab}
            onChange={setTab}
            options={[...(isMine ? [{ value: 'logs', label: `날짜별 기록 ${logs.length}` }] : []), { value: 'reviews', label: `독후감 ${reviews.length}` }]}
          />
        </div>
        {tab === 'logs' && isMine ? (
          logs.length === 0 ? (
            <p className="py-8 text-center text-[13.5px] text-ink-soft">
              {record?.status === 'WANT_TO_READ' ? '읽기 시작하면 날짜별 기록이 쌓여요.' : '아직 날짜별 기록이 없어요.'}
            </p>
          ) : (
            <ol className="relative flex flex-col gap-2 border-l-2 border-dashed border-ink/30 pl-5">
              {logs.map((l) => (
                <li key={l.id} className="card relative flex items-center gap-3 px-3.5 py-2">
                  <span className="absolute top-1/2 -left-[27px] h-3 w-3 -translate-y-1/2 rounded-full border-[1.5px] border-ink bg-rose" aria-hidden />
                  <span className="w-16 shrink-0 font-pixel text-[12px] text-ink-soft">{formatDay(l.date)}</span>
                  <span className="min-w-0 flex-1 text-[13.5px]">
                    <b>{l.pagesRead}쪽</b>
                    {l.memo && <span className="text-ink-soft"> — {l.memo}</span>}
                    {l.isAuto && <span className="ml-1 text-[11.5px] text-ink-soft">(진행 업데이트)</span>}
                  </span>
                  <button
                    onClick={() => setLogToDelete(l)}
                    aria-label={`${formatDay(l.date)} 기록 삭제`}
                    className="rounded-[4px] p-1 text-ink-soft transition hover:bg-rose hover:text-berry"
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ol>
          )
        ) : reviews.length === 0 ? (
          <p className="py-8 text-center text-[13.5px] text-ink-soft">아직 볼 수 있는 독후감이 없어요.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} showBook={false} />
            ))}
          </div>
        )}
      </div>

      {isMine && record && <LogModal open={logOpen} onClose={() => setLogOpen(false)} record={{ ...record, book }} />}
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => remove.mutate()}
        loading={remove.isPending}
        title="책 삭제"
        message={<p>「{book.title}」을(를) 삭제할까요? 독서 기록, 날짜별 기록, 이 책의 독후감도 함께 삭제되고 되돌릴 수 없어요.</p>}
      />
      <ConfirmDialog
        open={!!logToDelete}
        onClose={() => setLogToDelete(null)}
        onConfirm={() => removeLog.mutate(logToDelete.id)}
        loading={removeLog.isPending}
        title="기록 삭제"
        confirmLabel="기록 지우기"
        message={logToDelete && <p>{formatDay(logToDelete.date)}에 읽은 {logToDelete.pagesRead}쪽 기록을 지울까요? 현재 페이지도 그만큼 되돌아가요.</p>}
      />
    </div>
  );
}

export default function BookDetailPage() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ['books', id], queryFn: () => bookApi.get(id) });
  return <QueryState query={q}>{(data) => <Body data={data} />}</QueryState>;
}
