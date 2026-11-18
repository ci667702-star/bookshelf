import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookCheck, BookPlus, Quote as QuoteIcon, NotebookPen, UserCheck, UserPlus } from 'lucide-react';
import { socialApi } from '../../services/index.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Avatar, StarRating } from '../ui/Misc.jsx';
import { Spinner } from '../ui/States.jsx';
import BookCover from '../book/BookCover.jsx';
import { formatDay, timeAgo } from '../../utils/format.js';

export function FollowButton({ userId, following, size = 'sm' }) {
  const qc = useQueryClient();
  const toast = useToast();
  const m = useMutation({
    mutationFn: () => socialApi.follow(userId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['follows'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['badges'] });
      toast.success(res.following ? '팔로우했어요. 친구 소식에 활동이 보여요.' : '팔로우를 취소했어요.');
    },
    onError: (e) => toast.error(e),
  });
  return (
    <Button size={size} variant={following ? 'outline' : 'primary'} onClick={() => m.mutate()} loading={m.isPending} aria-pressed={following}>
      {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
      {following ? '팔로잉' : '팔로우'}
    </Button>
  );
}

/** 팔로워 / 팔로잉 목록 */
export function FollowListModal({ open, onClose, userId, type }) {
  const q = useQuery({ queryKey: ['follows', userId, type], queryFn: () => socialApi.follows(userId, type), enabled: open });
  return (
    <Modal open={open} onClose={onClose} title={type === 'followers' ? '팔로워' : '팔로잉'} tone="green" size="sm">
      {q.isPending ? (
        <div className="grid place-items-center py-8">
          <Spinner />
        </div>
      ) : q.isError ? (
        <p className="text-berry">{q.error.message}</p>
      ) : q.data.items.length === 0 ? (
        <p className="py-6 text-center text-[13.5px] text-ink-soft">{type === 'followers' ? '아직 팔로워가 없어요.' : '아직 팔로우한 사람이 없어요.'}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {q.data.items.map((u) => (
            <li key={u.id} className="flex items-center gap-3 rounded-[6px] px-1 py-1.5">
              <Link to={`/users/${u.id}`} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-2.5">
                <Avatar user={u} size={34} />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold">{u.nickname}</span>
                  {u.bio && <span className="block truncate text-[12px] text-ink-soft">{u.bio}</span>}
                </span>
              </Link>
              {!u.isMe && <FollowButton userId={u.id} following={u.isFollowing} size="xs" />}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

const FEED_META = {
  finish: { icon: BookCheck, text: '을(를) 다 읽었어요', tone: 'bg-matcha' },
  add: { icon: BookPlus, text: '을(를) 책장에 꽂았어요', tone: 'bg-sky' },
  review: { icon: NotebookPen, text: '독후감을 썼어요', tone: 'bg-butter' },
  quote: { icon: QuoteIcon, text: '에서 문장을 모았어요', tone: 'bg-rose' },
};

export function FeedItem({ item, compact = false }) {
  const meta = FEED_META[item.type];
  const Icon = meta.icon;
  return (
    <li className={`flex gap-3 ${compact ? 'py-2' : 'card p-3'}`}>
      <Link to={`/users/${item.user.id}`} className="shrink-0" aria-label={`${item.user.nickname} 프로필`}>
        <Avatar user={item.user} size={compact ? 28 : 36} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-snug">
          <Link to={`/users/${item.user.id}`} className="font-bold hover:underline">
            {item.user.nickname}
          </Link>
          님이{' '}
          {item.type === 'review' ? (
            <>
              「<Link to={`/books/${item.book.id}`} className="font-semibold hover:underline">{item.book.title}</Link>」 {meta.text}
            </>
          ) : (
            <>
              「<Link to={`/books/${item.book.id}`} className="font-semibold hover:underline">{item.book.title}</Link>」{meta.text}
            </>
          )}
        </p>
        {!compact && item.type === 'review' && (
          <Link to={`/reviews/${item.review.id}`} className="mt-1 block truncate font-pixel text-[13px] text-link hover:underline">
            {item.review.title}
          </Link>
        )}
        {!compact && item.type === 'quote' && <p className="hand mt-1 line-clamp-3 text-[17px] leading-snug">“{item.quote.content}”</p>}
        {!compact && item.type === 'finish' && item.rating ? <StarRating value={item.rating} size={12} /> : null}
        <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-ink-soft">
          <span className={`inline-grid h-4 w-4 place-items-center rounded-[3px] border border-ink/40 ${meta.tone}`}>
            <Icon size={10} />
          </span>
          {item.type === 'finish' && item.date ? formatDay(item.date) : timeAgo(item.at)}
        </p>
      </div>
      {!compact && <BookCover book={item.book} className="h-14 w-10 shrink-0" />}
    </li>
  );
}

export function useFeed(enabled = true) {
  return useQuery({ queryKey: ['feed'], queryFn: socialApi.feed, enabled });
}

export function FollowCounts({ profile }) {
  const [open, setOpen] = useState(null);
  return (
    <>
      <div className="flex gap-3 text-[13px]">
        <button onClick={() => setOpen('followers')} className="hover:underline">
          팔로워 <b>{profile.followerCount}</b>
        </button>
        <button onClick={() => setOpen('following')} className="hover:underline">
          팔로잉 <b>{profile.followingCount}</b>
        </button>
      </div>
      <FollowListModal open={!!open} onClose={() => setOpen(null)} userId={profile.user.id} type={open ?? 'followers'} />
    </>
  );
}
