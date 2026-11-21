import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button.jsx';
import { CloseBox, Ribbon } from './Window.jsx';

const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

/** 책장 한 장을 펼친 대화상자: 명조 제목 + 이중 괘선 + 책갈피 끈(tone) */
export default function Modal({ open, onClose, title, tone = 'rose', size = 'md', children, footer }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // 첫 번째 입력 요소에 포커스
    requestAnimationFrame(() => {
      const el = panelRef.current?.querySelector(
        'input:not([type=hidden]):not([disabled]), textarea, select, [data-autofocus]'
      );
      (el || panelRef.current)?.focus();
    });
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-ink/35 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] w-full animate-pop flex-col rounded-t-[6px] border-[1.5px] border-ink/85 bg-paper outline-none sm:rounded-[3px] sm:shadow-[var(--shadow-pages)] ${SIZES[size]}`}
      >
        <Ribbon tone={tone} className="absolute -top-[1.5px] right-14 h-10 w-[17px]" />
        <div className="flex shrink-0 items-center gap-2 px-5 pt-4 pr-3 sm:px-6">
          <h2 id={titleId} className="min-w-0 flex-1 truncate pr-12 font-serif text-[19px] font-bold">
            {title}
          </h2>
          <CloseBox onClose={onClose} label="닫기" />
        </div>
        <div className="rule-book mx-5 mt-2 shrink-0 text-ink/85 sm:mx-6" aria-hidden />
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
        {footer && (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-ink/20 bg-milk px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = '삭제', loading, tone = 'rose', danger = true }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      tone={tone}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[14.5px] leading-relaxed text-ink">{message}</div>
    </Modal>
  );
}
