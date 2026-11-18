import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Lock, Pencil, Trash2, Users } from 'lucide-react';
import { reviewApi } from '../services/index.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import Button from '../components/ui/Button.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { QueryState } from '../components/ui/States.jsx';
import { Avatar, StarRating } from '../components/ui/Misc.jsx';
import Sticker from '../components/ui/Sticker.jsx';
import BookCover from '../components/book/BookCover.jsx';
import { CommentSection, LikeButton } from '../components/review/ReviewParts.jsx';
import { formatDateTime, formatDay } from '../utils/format.js';

function Body({ data }) {
  const { review, record } = data;
  useDocumentTitle(review.title);
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const remove = useMutation({
    mutationFn: () => reviewApi.remove(review.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('독후감을 삭제했어요.');
      navigate('/reviews?tab=mine');
    },
    onError: (e) => toast.error(e),
  });

  const paragraphs = review.content.split(/\n{2,}/);

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={15} /> 뒤로
      </button>

      <article className="card relative overflow-hidden px-5 py-8 sm:px-12 sm:py-12">
        <Sticker type="flower" className="absolute top-5 right-5 h-11 w-11 rotate-12 opacity-90" />
        {/* 관련 책 */}
        {review.book && (
          <Link to={`/books/${review.book.id}`} className="group mb-8 flex items-center gap-4">
            <BookCover book={review.book} className="h-[88px] w-[62px] shrink-0 transition-transform group-hover:-translate-y-0.5" />
            <span className="min-w-0">
              <span className="block truncate font-serif text-[16px] font-bold group-hover:underline">{review.book.title}</span>
              <span className="block truncate text-[13px] text-ink-soft">{review.book.author}</span>
              {record?.finishDate && <span className="block text-[12px] text-ink-soft">{formatDay(record.finishDate, { withYear: true })} 완독</span>}
            </span>
          </Link>
        )}

        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          {!review.isPublic && (
            <span className="inline-flex items-center gap-1 rounded-full bg-kraft px-2.5 py-0.5 font-semibold text-ink-soft">
              <Lock size={12} /> 나만 보기
            </span>
          )}
          {review.sharedBookshelf && (
            <Link to={`/shared/${review.sharedBookshelf.id}`} className="inline-flex items-center gap-1 rounded-full bg-matcha px-2.5 py-0.5 font-semibold text-matcha-deep">
              <Users size={12} /> {review.sharedBookshelf.name}
            </Link>
          )}
        </div>
        <h1 className="mt-3 text-[28px] leading-snug sm:text-[36px]">{review.title}</h1>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-dashed border-kraft-deep pb-6">
          <Link to={`/users/${review.user.id}`} className="flex items-center gap-2.5">
            <Avatar user={review.user} size={40} />
            <span>
              <span className="block text-[14px] font-bold hover:underline">{review.user.nickname}</span>
              <span className="block text-[12px] text-ink-soft">
                {formatDateTime(review.createdAt)}
                {review.updatedAt !== review.createdAt && ' (수정됨)'}
              </span>
            </span>
          </Link>
          {review.rating ? (
            <span className="ml-auto">
              <StarRating value={review.rating} size={18} />
            </span>
          ) : null}
        </div>

        <div className="prose-review mt-8 font-sans text-[16.5px] leading-[1.95] text-ink sm:text-[17.5px]">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {p}
            </p>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-kraft-deep/60 pt-6">
          <LikeButton review={review} />
          {review.isMine && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" to={`/reviews/${review.id}/edit`}>
                <Pencil size={14} /> 수정
              </Button>
              <Button variant="danger-ghost" size="sm" onClick={() => setDeleting(true)}>
                <Trash2 size={14} /> 삭제
              </Button>
            </div>
          )}
        </div>
      </article>

      <CommentSection reviewId={review.id} />

      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => remove.mutate()}
        loading={remove.isPending}
        title="독후감 삭제"
        message={<p>「{review.title}」을(를) 삭제할까요? 좋아요와 댓글도 함께 사라지고 되돌릴 수 없어요.</p>}
      />
    </div>
  );
}

export default function ReviewDetailPage() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ['reviews', id], queryFn: () => reviewApi.get(id) });
  return <QueryState query={q}>{(data) => <Body data={data} />}</QueryState>;
}
