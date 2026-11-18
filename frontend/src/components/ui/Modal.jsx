import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button.jsx';
import { CloseBox } from './Window.jsx';

const TONES = {
  lime: 'bg-lime',
  tangerine: 'bg-tangerine',
  aqua: 'bg-aqua',
  rose: 'bg-rose',
  green: 'bg-matcha',
  sky: 'bg-sky',
  butter: 'bg-butter',
  lilac: 'bg-lilac',
  kraft: 'bg-kraft',
};
const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

/** 레트로 OS 창 모양의 대화상자 */
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
        className={`relative flex max-h-[92dvh] w-full animate-pop flex-col overflow-hidden rounded-t-[10px] border-[1.5px] border-ink/85 bg-paper shadow-[6px_6px_0_rgba(81,68,61,0.85)] outline-none sm:rounded-[6px] ${SIZES[size]}`}
      >
        <div className={`flex h-9 shrink-0 items-center gap-2 border-b-[1.5px] border-ink/85 px-2.5 ${TONES[tone]}`}>
          <h2 id={titleId} className="min-w-0 flex-1 truncate font-pixel text-[13px] font-bold">
            {title}
          </h2>
          <CloseBox onClose={onClose} label="닫기" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
        {footer && (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-ink/25 bg-chrome px-5 py-3">
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
