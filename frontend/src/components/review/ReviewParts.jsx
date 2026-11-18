import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Lock, MessageCircle, Trash2, Users } from 'lucide-react';
import { reviewApi } from '../../services/index.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import BookCover from '../book/BookCover.jsx';
import { Avatar, StarRating } from '../ui/Misc.jsx';
import Button from '../ui/Button.jsx';
import { Spinner } from '../ui/States.jsx';
import { timeAgo, formatDateTime } from '../../utils/format.js';

/** 블로그 글 카드 형태의 독후감 */
export function ReviewCard({ review, showBook = true, compact = false }) {
  const excerpt = review.content.replace(/\s+/g, ' ').slice(0, compact ? 90 : 160);
  return (
    <article className="card group relative flex gap-4 p-4 transition-shadow hover:shadow-[var(--shadow-lift)] sm:p-5">
      {showBook && review.book && (
        <BookCover book={review.book} className={`shrink-0 ${compact ? 'h-16 w-12' : 'h-24 w-[68px]'}`} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {showBook && review.book && <p className="truncate text-[12px] font-semibold text-cocoa">{review.book.title}</p>}
        <h3 className={`font-serif ${compact ? 'text-[16px]' : 'text-[18px]'} leading-snug text-ink`}>
          <Link to={`/reviews/${review.id}`} className="after:absolute after:inset-0 hover:underline decoration-rose-deep decoration-2 underline-offset-4">
            {review.title}
          </Link>
        </h3>
        {!compact && <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-ink-soft">{excerpt}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2.5 text-[12.5px] text-ink-soft">
          <span className="flex items-center gap-1.5">
            <Avatar user={review.user} size={22} />
            <span className="font-semibold text-ink">{review.user?.nickname}</span>
          </span>
          <span>{timeAgo(review.createdAt)}</span>
          {review.rating ? <StarRating value={review.rating} size={12} /> : null}
          <span className="flex items-center gap-0.5">
            <Heart size={13} className={review.likedByMe ? 'fill-pin text-pin' : ''} /> {review.likeCount}
          </span>
          <span className="flex items-center gap-0.5">
            <MessageCircle size={13} /> {review.commentCount}
          </span>
          {!review.isPublic && (
            <span className="flex items-center gap-0.5 text-cocoa-deep">
              <Lock size={12} /> 비공개
            </span>
          )}
          {review.sharedBookshelf && (
            <span className="flex items-center gap-0.5 text-matcha-deep">
              <Users size={12} /> {review.sharedBookshelf.name}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function LikeButton({ review }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [state, setState] = useState({ liked: review.likedByMe, count: review.likeCount });
  const m = useMutation({
    mutationFn: () => reviewApi.like(review.id),
    onMutate: () => setState((s) => ({ liked: !s.liked, count: s.count + (s.liked ? -1 : 1) })),
    onSuccess: (res) => {
      setState({ liked: res.liked, count: res.likeCount });
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (e) => {
      setState({ liked: review.likedByMe, count: review.likeCount });
      toast.error(e);
    },
  });
  return (
    <button
      type="button"
      onClick={() => m.mutate()}
      disabled={m.isPending}
      aria-pressed={state.liked}
      className={`inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] px-5 text-[14px] font-semibold transition ${
        state.liked ? 'border-pin/60 bg-rose text-ink' : 'border-kraft-deep bg-paper text-ink-soft hover:border-rose-deep hover:text-ink'
      }`}
    >
      <Heart size={18} className={`transition ${state.liked ? 'scale-110 fill-pin text-pin' : ''}`} />
      좋아요 {state.count}
    </button>
  );
}

export function CommentSection({ reviewId }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [content, setContent] = useState('');
  const key = ['reviews', reviewId, 'comments'];
  const q = useQuery({ queryKey: key, queryFn: () => reviewApi.comments(reviewId) });

  const add = useMutation({
    mutationFn: () => reviewApi.addComment(reviewId, content.trim()),
    onSuccess: () => {
      setContent('');
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['reviews', reviewId] });
    },
    onError: (e) => toast.error(e),
  });
  const remove = useMutation({
    mutationFn: (id) => reviewApi.removeComment(reviewId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success('댓글을 지웠어요.');
    },
    onError: (e) => toast.error(e),
  });

  const items = q.data?.items ?? [];
  return (
    <section aria-labelledby="comments-title" className="mt-10">
      <h2 id="comments-title" className="mb-4 flex items-center gap-2 text-[19px]">
        댓글 <span className="font-sans text-[15px] font-semibold text-ink-soft">{items.length}</span>
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (content.trim()) add.mutate();
        }}
        className="mb-6 flex flex-col gap-2 sm:flex-row"
      >
        <label htmlFor="comment-input" className="sr-only">
          댓글 쓰기
        </label>
        <textarea
          id="comment-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="따뜻한 한마디를 남겨 주세요"
          className="field min-h-12 flex-1 resize-none"
        />
        <Button type="submit" loading={add.isPending} disabled={!content.trim()} className="sm:self-end">
          댓글 남기기
        </Button>
      </form>
      {q.isPending ? (
        <Spinner />
      ) : q.isError ? (
        <p className="text-[13.5px] text-berry">{q.error.message}</p>
      ) : items.length === 0 ? (
        <p className="rounded-[8px] bg-milk px-4 py-6 text-center text-[13.5px] text-ink-soft">첫 댓글을 남겨 보세요.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((c) => (
            <li key={c.id} className="flex gap-3 rounded-[8px] bg-milk px-4 py-3">
              <Link to={`/users/${c.user.id}`} aria-label={`${c.user.nickname} 프로필`}>
                <Avatar user={c.user} size={32} />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[13px]">
                  <Link to={`/users/${c.user.id}`} className="font-semibold hover:underline">
                    {c.user.nickname}
                  </Link>
                  <span className="text-ink-soft" title={formatDateTime(c.createdAt)}>
                    {timeAgo(c.createdAt)}
                  </span>
                </p>
                <p className="mt-0.5 text-[14px] whitespace-pre-wrap">{c.content}</p>
              </div>
              {c.canDelete && (
                <button
                  onClick={() => remove.mutate(c.id)}
                  aria-label="댓글 삭제"
                  className="self-start rounded-full p-1.5 text-ink-soft transition hover:bg-rose hover:text-berry"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
