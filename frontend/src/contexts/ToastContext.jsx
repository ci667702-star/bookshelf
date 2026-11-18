import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Check, CircleAlert, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = { success: Check, error: CircleAlert, info: Info };
const TONES = {
  success: 'bg-matcha text-ink',
  error: 'bg-rose text-ink',
  info: 'bg-sky text-ink',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = ++idRef.current;
      setToasts((t) => [...t.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), type === 'error' ? 5000 : 3000);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', typeof m === 'string' ? m : m?.message || '문제가 생겼어요.'),
      info: (m) => push('info', m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 lg:items-end lg:pr-6"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex max-w-sm animate-pop items-center gap-2.5 rounded-[8px] border-[1.5px] border-ink/80 px-4 py-3 text-[14px] font-medium shadow-[4px_4px_0_rgba(81,68,61,0.8)] ${TONES[t.type]}`}
            >
              <Icon size={17} strokeWidth={2.4} className="shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} aria-label="알림 닫기" className="rounded-full p-0.5 hover:bg-white/60">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
