import { useCallback, useState } from 'react';
import { ScanBarcode, Search } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner.jsx';
import { bookSearchApi } from '../../services/index.js';
import Button from '../ui/Button.jsx';
import { Spinner } from '../ui/States.jsx';

function Thumb({ src, title }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span className="grid h-[60px] w-[42px] shrink-0 place-items-center border-[1.5px] border-ink/60 bg-kraft font-pixel text-[9px] text-ink-soft">
        표지 없음
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={`${title} 표지`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className="h-[60px] w-[42px] shrink-0 border-[1.5px] border-ink/80 object-cover"
    />
  );
}

/**
 * 책 검색으로 표지 · 제목 · 저자 · 출판사 채우기
 * onPick(item) — item: { title, author, publisher, coverImage, totalPages, isbn }
 */
export default function BookSearch({ onPick }) {
  const [q, setQ] = useState('');
  const [state, setState] = useState({ status: 'idle', items: [], provider: null, error: null });

  const [scanning, setScanning] = useState(false);
  const closeScanner = useCallback(() => setScanning(false), []);

  const run = async (override) => {
    const query = (typeof override === 'string' ? override : q).trim();
    if (!query) return;
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await bookSearchApi.search(query);
      setState({ status: 'done', items: res.items, provider: res.providerLabel, error: null });
    } catch (err) {
      setState({ status: 'error', items: [], provider: null, error: err.message });
    }
  };

  const onBarcode = useCallback(
    (isbn) => {
      setQ(isbn);
      run(isbn);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="rounded-[8px] border-[1.5px] border-ink/85 bg-sky/60 p-3 sm:p-4">
      <label htmlFor="book-search" className="mb-1.5 block font-pixel text-[13px] font-bold">
        책 검색으로 채우기
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft" />
          <input
            id="book-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              // 바깥 폼 제출 대신 검색 실행
              if (e.key === 'Enter') {
                e.preventDefault();
                run();
              }
            }}
            placeholder="제목, 저자, ISBN"
            maxLength={100}
            className="field h-10 pl-9 text-[14px]"
          />
        </div>
        <Button size="md" variant="outline" onClick={() => run()} loading={state.status === 'loading'} disabled={!q.trim()}>
          검색
        </Button>
        <Button size="md" variant="soft" onClick={() => setScanning(true)} aria-label="바코드로 찾기" title="바코드로 찾기">
          <ScanBarcode size={17} />
          <span className="hidden sm:inline">바코드</span>
        </Button>
      </div>
      <BarcodeScanner open={scanning} onClose={closeScanner} onDetected={onBarcode} />

      {state.status === 'loading' && (
        <div className="grid place-items-center py-5">
          <Spinner />
        </div>
      )}
      {state.status === 'error' && (
        <p role="alert" className="mt-2 text-[13px] font-medium text-berry">
          {state.error}
        </p>
      )}
      {state.status === 'done' &&
        (state.items.length === 0 ? (
          <p className="mt-2 text-[13px] text-ink-soft">검색 결과가 없어요. 아래에 직접 입력해 주세요.</p>
        ) : (
          <>
            <ul className="mt-2.5 max-h-72 divide-y divide-ink/10 overflow-y-auto rounded-[6px] border-[1.5px] border-ink/60 bg-paper" aria-label="책 검색 결과">
              {state.items.map((item, i) => (
                <li key={`${item.isbn ?? item.title}-${i}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(item);
                      setState((s) => ({ ...s, status: 'idle', items: [] }));
                    }}
                    className="flex w-full items-center gap-3 px-2.5 py-2 text-left transition hover:bg-butter/60 focus-visible:bg-butter/60"
                  >
                    <Thumb src={item.coverImage} title={item.title} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-pixel text-[13px] font-bold">{item.title}</span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {[item.author, item.publisher, item.pubYear].filter(Boolean).join(' / ')}
                      </span>
                    </span>
                    <span className="shrink-0 font-pixel text-[11.5px] text-link">선택</span>
                  </button>
                </li>
              ))}
            </ul>
            {state.provider && <p className="mt-1.5 text-right text-[11px] text-ink-soft">검색 제공: {state.provider}</p>}
          </>
        ))}
    </div>
  );
}
