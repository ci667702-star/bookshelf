import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Ruler, Settings } from 'lucide-react';
import { quoteApi, readingApi, reviewApi, userApi } from '../services/index.js';
import { BadgeGrid, useBadges } from '../components/social/Badges.jsx';
import { QuoteModal, QuoteNote, useDeleteQuote } from '../components/social/Quotes.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import Button from '../components/ui/Button.jsx';
import { QueryState } from '../components/ui/States.jsx';
import { Avatar, Segmented } from '../components/ui/Misc.jsx';
import { ReviewCard } from '../components/review/ReviewParts.jsx';
import { ShelfCard } from '../components/shelf/ShelfParts.jsx';
import { formatDateTime, num } from '../utils/format.js';

export default function MyPage() {
  useDocumentTitle('마이페이지');
  const { user } = useAuth();
  const [tab, setTab] = useState('shelves');
  const profile = useQuery({ queryKey: ['users', user.id], queryFn: () => userApi.profile(user.id) });
  const marathon = useQuery({ queryKey: ['marathon'], queryFn: readingApi.marathon });
  const reviews = useQuery({
    queryKey: ['reviews', 'list', 'mine', 'recent', '', 1],
    queryFn: () => reviewApi.list({ scope: 'mine', limit: 10 }),
    enabled: tab === 'reviews',
  });
  const badges = useBadges(tab === 'badges');
  const quotes = useQuery({ queryKey: ['quotes', 'mine'], queryFn: () => quoteApi.list({ scope: 'mine' }), enabled: tab === 'quotes' });
  const delQuote = useDeleteQuote();
  const [editing, setEditing] = useState(null);
  const m = marathon.data;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar user={user} size={80} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px]">{user.nickname}</h1>
          <p className="text-[13px] text-ink-soft">
            {user.email} · {formatDateTime(user.createdAt)} 가입
          </p>
          {user.bio && <p className="mt-1.5 text-[14px]">{user.bio}</p>}
        </div>
        <div className="flex gap-2">
          <Button to={`/users/${user.id}`} variant="outline" size="sm">
            공개 프로필
          </Button>
          <Button to="/settings" variant="soft" size="sm">
            <Settings size={14} /> 설정
          </Button>
        </div>
      </section>

      <section aria-label="나의 독서 통계" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          ['완독한 책', m ? m.finishedCount : '–', '권', 'bg-matcha'],
          ['누적 페이지', m ? num(m.totalPages) : '–', '쪽', 'bg-butter'],
          ['독서 높이', m ? m.heightCm : '–', 'cm', 'bg-sky'],
          ['올해 목표', m ? `${m.goals.yearlyRate}` : '–', '%', 'bg-lilac'],
        ].map(([label, v, u, tone]) => (
          <div key={label} className={`tile ${tone} px-3 py-2.5`}>
            <p className="text-[12px] font-semibold text-ink/70">{label}</p>
            <p className="flex items-baseline gap-1">
              <span className="numeral text-[22px]">{v}</span>
              <span className="text-[12px] font-bold">{u}</span>
            </p>
          </div>
        ))}
      </section>
      <Link to="/marathon" className="-mt-3 inline-flex items-center gap-1.5 self-start font-pixel text-[12.5px] text-link hover:underline">
        <Ruler size={14} /> 독서 마라톤 책탑 보기 ›
      </Link>

      <div>
        <div className="mb-4">
          <Segmented
            label="내 기록"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'shelves', label: '내 책장' },
              { value: 'reviews', label: '내 독후감' },
              { value: 'quotes', label: '내 문장' },
              { value: 'badges', label: '배지' },
            ]}
          />
        </div>
        {tab === 'badges' ? (
          <QueryState query={badges}>{(b) => <BadgeGrid badges={b.badges} />}</QueryState>
        ) : tab === 'quotes' ? (
          <QueryState query={quotes}>
            {(r) =>
              r.items.length === 0 ? (
                <p className="py-8 text-center text-[13.5px] text-ink-soft">
                  아직 모은 문장이 없어요. 책 정보 화면의 「문장 모으기」로 시작해 보세요.
                </p>
              ) : (
                <div className="grid gap-5 pt-2 sm:grid-cols-2 lg:grid-cols-3">
                  {r.items.map((q, i) => (
                    <QuoteNote key={q.id} quote={q} index={i} showBook onEdit={setEditing} onDelete={(x) => delQuote.mutate(x)} />
                  ))}
                </div>
              )
            }
          </QueryState>
        ) : tab === 'shelves' ? (
          <QueryState query={profile}>
            {(p) => (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {p.shelves.map((s) => (
                  <ShelfCard key={s.id} shelf={s} />
                ))}
              </div>
            )}
          </QueryState>
        ) : (
          <QueryState query={reviews}>
            {(r) =>
              r.items.length === 0 ? (
                <p className="py-8 text-center text-[13.5px] text-ink-soft">
                  아직 쓴 독후감이 없어요.{' '}
                  <Link to="/reviews/new" className="font-semibold text-link underline">
                    첫 독후감 쓰기
                  </Link>
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {r.items.map((rv) => (
                    <ReviewCard key={rv.id} review={rv} />
                  ))}
                </div>
              )
            }
          </QueryState>
        )}
      </div>
      <QuoteModal open={!!editing} onClose={() => setEditing(null)} quote={editing} book={editing?.book} />
    </div>
  );
}
