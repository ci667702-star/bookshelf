import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reviewApi, userApi } from '../services/index.js';
import { useDocumentTitle } from '../hooks/index.js';
import Button from '../components/ui/Button.jsx';
import { QueryState } from '../components/ui/States.jsx';
import { Avatar, SectionTitle } from '../components/ui/Misc.jsx';
import { ReviewCard } from '../components/review/ReviewParts.jsx';
import { ShelfCard } from '../components/shelf/ShelfParts.jsx';
import { FollowButton, FollowCounts } from '../components/social/Follow.jsx';
import { QuoteNote } from '../components/social/Quotes.jsx';
import { quoteApi } from '../services/index.js';
import { formatDateTime, num } from '../utils/format.js';

function Body({ data, id }) {
  const { user, stats, shelves, isMe, isFollowing } = data;
  const quotes = useQuery({ queryKey: ['quotes', 'user', id], queryFn: () => quoteApi.list({ scope: 'user', userId: id, limit: 6 }) });
  useDocumentTitle(`${user.nickname}님의 책장`);
  const reviews = useQuery({ queryKey: ['reviews', 'list', 'user', id], queryFn: () => reviewApi.list({ scope: 'user', userId: id, limit: 10 }) });
  return (
    <div className="flex flex-col gap-10">
      <section className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
        <Avatar user={user} size={92} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px]">{user.nickname}</h1>
          <p className="text-[13px] text-ink-soft">{formatDateTime(user.createdAt)}부터 기록 중</p>
          {user.bio && <p className="mt-2 text-[14.5px]">{user.bio}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <FollowCounts profile={data} />
            {!isMe && <FollowButton userId={user.id} following={isFollowing} size="xs" />}
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ['완독', `${stats.finished}권`],
            ['쌓은 높이', `${stats.heightCm}cm`],
            ['독후감', `${num(stats.reviews)}편`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-[3px] bg-milk px-3 py-2.5">
              <dt className="text-[11.5px] text-ink-soft">{k}</dt>
              <dd className="numeral text-[20px]">{v}</dd>
            </div>
          ))}
        </dl>
        {isMe && (
          <Button to="/settings" variant="soft" size="sm">
            프로필 수정
          </Button>
        )}
      </section>
      {!isMe && <p className="-mt-7 text-[12px] text-ink-soft">통계는 공개된 책장과 독후감 기준이에요.</p>}

      <section>
        <SectionTitle title={isMe ? '내 책장' : '공개 책장'} />
        {shelves.length === 0 ? (
          <p className="rounded-[3px] bg-milk px-4 py-8 text-center text-[13.5px] text-ink-soft">공개된 책장이 없어요.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shelves.map((s) => (
              <ShelfCard key={s.id} shelf={s} />
            ))}
          </div>
        )}
      </section>

      {quotes.data?.items.length > 0 && (
        <section>
          <SectionTitle title="모은 문장" />
          <div className="grid gap-5 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            {quotes.data.items.map((q, i) => (
              <QuoteNote key={q.id} quote={q} index={i} showBook />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle title="독후감" />
        <QueryState query={reviews}>
          {(r) =>
            r.items.length === 0 ? (
              <p className="rounded-[3px] bg-milk px-4 py-8 text-center text-[13.5px] text-ink-soft">볼 수 있는 독후감이 없어요.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {r.items.map((rv) => (
                  <ReviewCard key={rv.id} review={rv} />
                ))}
              </div>
            )
          }
        </QueryState>
      </section>
    </div>
  );
}

export default function UserProfilePage() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ['users', id], queryFn: () => userApi.profile(id) });
  return <QueryState query={q}>{(data) => <Body data={data} id={id} />}</QueryState>;
}
