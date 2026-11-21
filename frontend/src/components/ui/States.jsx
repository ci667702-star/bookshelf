import { RefreshCw } from 'lucide-react';
import Button from './Button.jsx';
import Sticker from './Sticker.jsx';

export function Spinner({ className = '' }) {
  return (
    <span className={`inline-flex items-end gap-[3px] ${className}`} role="status" aria-label="불러오는 중">
      {['bg-rose-deep', 'bg-ink', 'bg-rose-deep'].map((c, i) => (
        <i
          key={i}
          className={`block w-[7px] animate-bounce rounded-[1px] border border-ink/80 ${c}`}
          style={{ height: 14 + i * 4, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}

export function PageLoader({ label = '책장을 정리하는 중...' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-soft">
      <Spinner />
      <p className="text-[13.5px]">{label}</p>
    </div>
  );
}

export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-[3px] bg-rose/40 ${className}`} />;
}

export function EmptyState({ sticker = 'book', title, description, action, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center text-center ${compact ? 'gap-2 py-8' : 'gap-3 py-14'} rounded-[3px] border-[1.5px] border-dashed border-ink/30 bg-milk/70 px-6`}
    >
      <Sticker kind="sticker" type={sticker} className={compact ? 'h-12 w-12' : 'h-16 w-16'} />
      <h3 className={`font-serif ${compact ? 'text-[16px]' : 'text-[19px]'} text-ink`}>{title}</h3>
      {description && <p className="max-w-sm text-[13.5px] text-ink-soft">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = '불러오지 못했어요' }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-[3px] border-[1.5px] border-rose-deep bg-rose/40 px-6 py-12 text-center">
      <Sticker kind="sticker" type="cloud" className="h-14 w-14" />
      <h3 className="font-serif text-[18px]">{title}</h3>
      <p className="max-w-sm text-[13.5px] text-ink-soft">{error?.message || '잠시 후 다시 시도해 주세요.'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw size={14} /> 다시 불러오기
        </Button>
      )}
    </div>
  );
}

/** react-query 결과에 따라 로딩/에러/본문을 렌더 */
export function QueryState({ query, loading, children }) {
  if (query.isPending) return loading ?? <PageLoader />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return children(query.data);
}
