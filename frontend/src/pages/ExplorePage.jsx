import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { miscApi } from '../services/index.js';
import { useDocumentTitle } from '../hooks/index.js';
import { QueryState, EmptyState } from '../components/ui/States.jsx';
import { Avatar, Segmented } from '../components/ui/Misc.jsx';
import BookCover from '../components/book/BookCover.jsx';
import { ReviewCard } from '../components/review/ReviewParts.jsx';
import { ShelfCard } from '../components/shelf/ShelfParts.jsx';
import { FeedItem, useFeed } from '../components/social/Follow.jsx';

const TABS = [
  { value: 'feed', label: '친구 소식' },
  { value: 'shelves', label: '공개 책장' },
  { value: 'reviews', label: '인기 독후감' },
  { value: 'books', label: '최근 공유된 책' },
];

/** 추천: 다른 사람들의 공개 책장 · 인기 독후감 · 최근 공유된 책 */
export default function ExplorePage() {
  useDocumentTitle('둘러보기');
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'feed';
  const q = useQuery({ queryKey: ['dashboard'], queryFn: miscApi.dashboard });
  const feed = useFeed(tab === 'feed');

  return (
    <div>
      <h1 className="text-[22px]">둘러보기</h1>
      <p className="mt-1 mb-4 text-[13.5px] text-ink-soft">다른 사람들이 공개한 책장과 독후감이에요.</p>
      <div className="mb-5">
        <Segmented label="둘러보기 종류" value={tab} onChange={(v) => setParams({ tab: v })} options={TABS} />
      </div>
      {tab === 'feed' ? (
        <QueryState query={feed}>
          {(f) =>
            f.items.length === 0 ? (
              <EmptyState
                compact
                sticker="cat"
                title={f.followingCount ? '친구들의 새 소식이 아직 없어요' : '아직 팔로우한 사람이 없어요'}
                description={f.followingCount ? '친구가 책을 다 읽거나 독후감을 쓰면 여기에 보여요.' : '공개 책장이나 독후감에서 마음에 드는 독자를 찾아 팔로우해 보세요.'}
              />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {f.items.map((item) => (
                  <FeedItem key={item.id} item={item} />
                ))}
              </ul>
            )
          }
        </QueryState>
      ) : (
      <QueryState query={q}>
        {(d) => {
          const rec = d.recommendations;
          if (tab === 'shelves') {
            return rec.publicShelves.length === 0 ? (
              <EmptyState compact title="아직 공개된 책장이 없어요" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rec.publicShelves.map((s) => (
                  <ShelfCard key={s.id} shelf={s} showOwner />
                ))}
              </div>
            );
          }
          if (tab === 'reviews') {
            return rec.popularReviews.length === 0 ? (
              <EmptyState compact sticker="star" title="최근 한 달 동안 공개된 독후감이 없어요" />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {rec.popularReviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            );
          }
          return rec.recentSharedBooks.length === 0 ? (
            <EmptyState compact title="최근 공개 책장에 꽂힌 책이 없어요" />
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {rec.recentSharedBooks.map((r) => (
                <li key={r.id}>
                  <Link to={`/books/${r.book.id}`} className="group block">
                    <BookCover book={r.book} className="aspect-[3/4] w-full transition-transform group-hover:-translate-y-1" />
                    <p className="mt-1.5 truncate font-pixel text-[12.5px] font-bold">{r.book.title}</p>
                  </Link>
                  <Link to={`/users/${r.user.id}`} className="mt-0.5 flex items-center gap-1 text-[11.5px] text-ink-soft hover:underline">
                    <Avatar user={r.user} size={16} /> {r.user.nickname}
                  </Link>
                </li>
              ))}
            </ul>
          );
        }}
      </QueryState>
      )}
    </div>
  );
}
