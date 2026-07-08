import { forwardRef, type SelectHTMLAttributes } from 'react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, className = '', children, ...props },
  ref,
) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[13px] font-semibold text-text-2">{label}</span>
      )}
      <select
        ref={ref}
        className={`w-full rounded-input border border-border-strong bg-surface px-[14px] py-[13px] text-[14.5px] text-text outline-none transition-colors focus:border-accent ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
});
