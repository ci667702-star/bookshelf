import { useId, cloneElement, isValidElement } from 'react';

/** 라벨 + 입력 + 도움말/오류를 묶는 필드 */
export function Field({ label, hint, error, required, children, className = '' }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': describedBy,
        required: children.props.required ?? required,
      })
    : children;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={children?.props?.id ?? id} className="text-[13.5px] font-semibold text-ink">
          {label}
          {required && <span className="ml-0.5 text-cocoa" aria-hidden>*</span>}
        </label>
      )}
      {control}
      {error ? (
        <p id={`${id}-err`} className="text-[12.5px] font-medium text-berry">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12.5px] text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`field h-11 ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`field min-h-28 resize-y leading-relaxed ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`field h-11 cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2351443D' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-9 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-[8px] border border-berry/25 bg-rose/50 px-4 py-3 text-[13.5px] font-medium text-berry">
      {message}
    </div>
  );
}
