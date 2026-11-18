import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { miscApi } from '../services/index.js';
import { useDebounce, useDocumentTitle } from '../hooks/index.js';
import { EmptyState, QueryState } from '../components/ui/States.jsx';
import { Avatar, Segmented } from '../components/ui/Misc.jsx';
import BookCover from '../components/book/BookCover.jsx';
import { ReviewCard } from '../components/review/ReviewParts.jsx';
import { ShelfCard } from '../components/shelf/ShelfParts.jsx';

const TYPES = [
  { value: 'all', label: '전체' },
  { value: 'books', label: '책 · 작가' },
  { value: 'users', label: '사용자' },
  { value: 'shelves', label: '책장' },
  { value: 'reviews', label: '독후감' },
];

function Group({ title, count, children }) {
  return (
    <section className="mb-9">
      <h2 className="mb-3 flex items-baseline gap-2 text-[19px]">
        {title} <span className="font-sans text-[13.5px] font-semibold text-ink-soft">{count}</span>
      </h2>
      {children}
    </section>
  );
}

export default function SearchPage() {
  useDocumentTitle('검색');
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(params.get('q') ?? '');
  const type = params.get('type') ?? 'all';
  const q = useDebounce(text.trim(), 350);

  // 상단 검색창에서 새로 들어온 경우에만 입력값을 맞춘다 (입력 중 덮어쓰기 방지)
  const urlQ = params.get('q') ?? '';
  useEffect(() => {
    if (urlQ !== q) setText(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQ]);

  useEffect(() => {
    const next = {};
    if (q) next.q = q;
    if (type !== 'all') next.type = type;
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const query = useQuery({ queryKey: ['search', q, type], queryFn: () => miscApi.search(q, type), enabled: q.length > 0 });

  return (
    <div>
      <h1 className="mb-4 text-[22px]">검색</h1>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative mb-4">
        <Search size={19} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft" />
        <label htmlFor="search-page-input" className="sr-only">
          검색어
        </label>
        <input
          id="search-page-input"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="책 제목, 작가, 닉네임, 책장, 독후감"
          className="field h-13 pl-12 text-[16px]"
        />
      </form>
      <div className="mb-7">
        <Segmented
          label="검색 종류"
          value={type}
          onChange={(v) => setParams(v === 'all' ? (q ? { q } : {}) : { ...(q ? { q } : {}), type: v })}
          options={TYPES}
        />
      </div>

      {!q ? (
        <EmptyState sticker="book" title="무엇을 찾고 있나요?" description="책 제목이나 작가 이름, 친구의 닉네임으로 찾아보세요. 공개된 책장과 독후감만 검색돼요." />
      ) : (
        <QueryState query={query}>
          {(r) => {
            const total = r.books.length + r.users.length + r.shelves.length + r.sharedShelves.length + r.reviews.length;
            if (!total) return <EmptyState sticker="cloud" title={`「${q}」 검색 결과가 없어요`} description="다른 낱말로 다시 찾아보세요." />;
            return (
              <>
                {r.books.length > 0 && (
                  <Group title="책" count={r.books.length}>
                    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                      {r.books.map((b) => (
                        <li key={b.id}>
                          <Link to={`/books/${b.book.id}`} className="group block">
                            <BookCover book={b.book} className="aspect-[3/4] w-full transition-transform group-hover:-translate-y-1" />
                            <p className="mt-1.5 truncate font-serif text-[13.5px] font-bold">{b.book.title}</p>
                            <p className="truncate text-[12px] text-ink-soft">{b.book.author}</p>
                          </Link>
                          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-ink-soft">
                            <Avatar user={b.user} size={14} /> {b.isMine ? '내 책장' : b.user.nickname}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </Group>
                )}
                {r.users.length > 0 && (
                  <Group title="사용자" count={r.users.length}>
                    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {r.users.map((u) => (
                        <li key={u.id}>
                          <Link to={`/users/${u.id}`} className="card flex items-center gap-3 p-3 transition hover:shadow-[var(--shadow-lift)]">
                            <Avatar user={u} size={42} />
                            <span className="min-w-0">
                              <span className="block truncate font-bold">{u.nickname}</span>
                              {u.bio && <span className="block truncate text-[12.5px] text-ink-soft">{u.bio}</span>}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Group>
                )}
                {(r.shelves.length > 0 || r.sharedShelves.length > 0) && (
                  <Group title="공개 책장" count={r.shelves.length + r.sharedShelves.length}>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {r.shelves.map((s) => (
                        <ShelfCard key={s.id} shelf={{ ...s, isPublic: true }} showOwner />
                      ))}
                      {r.sharedShelves.map((s) => (
                        <Link key={s.id} to={`/shared/${s.id}`} className="card flex flex-col gap-1 p-4 transition hover:shadow-[var(--shadow-lift)]">
                          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-matcha-deep">
                            <Users size={13} /> 공유 책장
                          </span>
                          <span className="font-serif text-[17px] font-bold">{s.name}</span>
                          {s.description && <span className="line-clamp-2 text-[13px] text-ink-soft">{s.description}</span>}
                          <span className="mt-auto pt-2 text-[12.5px] text-ink-soft">
                            참여자 {s.memberCount}명 · 책 {s.bookCount}권
                          </span>
                        </Link>
                      ))}
                    </div>
                  </Group>
                )}
                {r.reviews.length > 0 && (
                  <Group title="독후감" count={r.reviews.length}>
                    <div className="grid gap-3 md:grid-cols-2">
                      {r.reviews.map((rv) => (
                        <ReviewCard key={rv.id} review={rv} />
                      ))}
                    </div>
                  </Group>
                )}
              </>
            );
          }}
        </QueryState>
      )}
    </div>
  );
}
