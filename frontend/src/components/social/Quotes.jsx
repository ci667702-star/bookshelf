import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Pencil, Trash2 } from 'lucide-react';
import { quoteApi } from '../../services/index.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Input, Textarea, FormError } from '../ui/Field.jsx';
import { Avatar, Toggle } from '../ui/Misc.jsx';
import { tilt } from '../../utils/color.js';
import { timeAgo } from '../../utils/format.js';

const NOTE_COLORS = ['bg-butter', 'bg-rose', 'bg-matcha', 'bg-sky', 'bg-lilac'];

/** 포스트잇처럼 붙인 문장 */
export function QuoteNote({ quote, showBook = false, showUser = false, onEdit, onDelete, index = 0 }) {
  return (
    <figure
      className={`relative flex h-full flex-col rounded-[3px] border-[1.5px] border-ink/80 p-4 pt-5 ${NOTE_COLORS[index % NOTE_COLORS.length]}`}
      style={{ transform: `rotate(${tilt(quote.id, 1.5)}deg)` }}
    >
      <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 border border-ink/20 bg-paper/80" aria-hidden />
      <blockquote className="bookish flex-1 text-[15px] leading-[1.75] whitespace-pre-wrap text-ink">“{quote.content}”</blockquote>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-ink/70">
        {showBook && quote.book && (
          <Link to={`/books/${quote.book.id}`} className="font-serif font-bold hover:underline">
            「{quote.book.title}」
          </Link>
        )}
        {quote.page ? <span>{quote.page}쪽</span> : null}
        {showUser && quote.user && (
          <Link to={`/users/${quote.user.id}`} className="flex items-center gap-1 hover:underline">
            <Avatar user={quote.user} size={16} /> {quote.user.nickname}
          </Link>
        )}
        {!quote.isPublic && (
          <span className="flex items-center gap-0.5">
            <Lock size={11} /> 나만 보기
          </span>
        )}
        <span>{timeAgo(quote.createdAt)}</span>
      </figcaption>
      {quote.memo && <p className="mt-1.5 border-t border-dashed border-ink/25 pt-1.5 text-[12.5px]">{quote.memo}</p>}
      {quote.isMine && (onEdit || onDelete) && (
        <div className="absolute top-1.5 right-1.5 flex gap-0.5">
          {onEdit && (
            <button onClick={() => onEdit(quote)} aria-label="문장 수정" className="rounded-[3px] p-1 text-ink/60 hover:bg-paper/70 hover:text-ink">
              <Pencil size={13} />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(quote)} aria-label="문장 삭제" className="rounded-[3px] p-1 text-ink/60 hover:bg-paper/70 hover:text-berry">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </figure>
  );
}

/** 문장 저장 · 수정 (책은 고정) */
export function QuoteModal({ open, onClose, book, quote }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [f, setF] = useState({ content: '', page: '', memo: '', isPublic: false });
  useEffect(() => {
    if (open) {
      setF({
        content: quote?.content ?? '',
        page: quote?.page ? String(quote.page) : '',
        memo: quote?.memo ?? '',
        isPublic: quote?.isPublic ?? false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const m = useMutation({
    mutationFn: () => {
      const body = { content: f.content.trim(), page: f.page ? Number(f.page) : null, memo: f.memo.trim() || null, isPublic: f.isPublic };
      return quote ? quoteApi.update(quote.id, body) : quoteApi.create({ ...body, bookId: book.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] });
      qc.invalidateQueries({ queryKey: ['badges'] });
      toast.success(quote ? '문장을 고쳤어요.' : '문장을 모았어요.');
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={quote ? '문장 고치기' : '문장 모으기'}
      tone="butter"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => m.mutate()} loading={m.isPending} disabled={!f.content.trim()}>
            {quote ? '저장하기' : '모으기'}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (f.content.trim()) m.mutate();
        }}
      >
        <FormError message={m.error && !Object.keys(m.error.fields || {}).length ? m.error.message : null} />
        {book && <p className="font-serif text-[13px]">「{book.title}」</p>}
        <Field label="마음에 남은 문장" required error={m.error?.fields?.content} hint={`${f.content.length}/500`}>
          <Textarea value={f.content} maxLength={500} rows={4} onChange={(e) => setF({ ...f, content: e.target.value })} placeholder="책에서 밑줄 긋고 싶은 문장" />
        </Field>
        <div className="grid grid-cols-[120px_1fr] gap-3">
          <Field label="쪽수" error={m.error?.fields?.page}>
            <Input type="number" min={1} max={book?.totalPages} value={f.page} onChange={(e) => setF({ ...f, page: e.target.value })} placeholder="예: 42" />
          </Field>
          <Field label="한 줄 메모">
            <Input value={f.memo} maxLength={200} onChange={(e) => setF({ ...f, memo: e.target.value })} placeholder="왜 좋았는지 (선택)" />
          </Field>
        </div>
        <Toggle
          checked={f.isPublic}
          onChange={(v) => setF({ ...f, isPublic: v })}
          label={f.isPublic ? '공개 문장' : '나만 보기'}
          description={f.isPublic ? '책 페이지와 친구 소식에 보여요.' : '나만 볼 수 있어요.'}
        />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (q) => quoteApi.remove(q.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('문장을 지웠어요.');
    },
    onError: (e) => toast.error(e),
  });
}
