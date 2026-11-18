import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { PenLine, Search } from 'lucide-react';
import { reviewApi } from '../services/index.js';
import { useDebounce, useDocumentTitle } from '../hooks/index.js';
import Button from '../components/ui/Button.jsx';
import { EmptyState, QueryState } from '../components/ui/States.jsx';
import { Segmented } from '../components/ui/Misc.jsx';
import { ReviewCard } from '../components/review/ReviewParts.jsx';

export default function ReviewsPage() {
  useDocumentTitle('독후감');
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'mine' ? 'mine' : 'feed';
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [qText, setQText] = useState('');
  const q = useDebounce(qText.trim(), 350);

  const query = useQuery({
    queryKey: ['reviews', 'list', tab, sort, q, page],
    queryFn: () => reviewApi.list({ scope: tab, sort, q: q || undefined, page, limit: 10 }),
    placeholderData: keepPreviousData,
  });

  const changeTab = (t) => {
    setPage(1);
    setParams(t === 'mine' ? { tab: 'mine' } : {});
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px]">독후감</h1>
          <p className="mt-1 text-[14px] text-ink-soft">한 권을 다 읽고 난 뒤의 마음을 블로그처럼 남겨요.</p>
        </div>
        <Button to="/reviews/new">
          <PenLine size={15} /> 독후감 쓰기
        </Button>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          label="독후감 범위"
          value={tab}
          onChange={changeTab}
          options={[
            { value: 'feed', label: '모두의 독후감' },
            { value: 'mine', label: '내 독후감' },
          ]}
        />
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft" />
            <input
              value={qText}
              onChange={(e) => {
                setQText(e.target.value);
                setPage(1);
              }}
              placeholder="제목, 내용, 책 이름"
              aria-label="독후감 검색"
              className="field h-9 pl-9 text-[13.5px]"
            />
          </div>
          <Segmented
            label="정렬"
            size="sm"
            value={sort}
            onChange={(v) => {
              setSort(v);
              setPage(1);
            }}
            options={[
              { value: 'recent', label: '최신순' },
              { value: 'popular', label: '인기순' },
            ]}
          />
        </div>
      </div>

      <QueryState query={query}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState
              sticker="star"
              title={q ? '검색 결과가 없어요' : tab === 'mine' ? '아직 쓴 독후감이 없어요' : '공개된 독후감이 아직 없어요'}
              description={tab === 'mine' && !q ? '다 읽은 책에 대한 생각을 남겨 보세요.' : undefined}
              action={!q && <Button to="/reviews/new" size="sm">독후감 쓰기</Button>}
            />
          ) : (
            <>
              <div className={`grid gap-3 md:grid-cols-2 ${query.isPlaceholderData ? 'opacity-60' : ''}`}>
                {data.items.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
              {(page > 1 || data.hasMore) && (
                <nav aria-label="페이지" className="mt-6 flex items-center justify-center gap-3">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    이전
                  </Button>
                  <span className="text-[13px] text-ink-soft tabular-nums">
                    {page} / {Math.max(1, Math.ceil(data.total / 10))}
                  </span>
                  <Button variant="outline" size="sm" disabled={!data.hasMore} onClick={() => setPage((p) => p + 1)}>
                    다음
                  </Button>
                </nav>
              )}
            </>
          )
        }
      </QueryState>
    </div>
  );
}
