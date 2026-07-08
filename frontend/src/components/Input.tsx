import { forwardRef, type InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, className = '', id, ...props },
  ref,
) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[13px] font-semibold text-text-2">{label}</span>
      )}
      <input
        ref={ref}
        id={id}
        className={`w-full rounded-input border border-border-strong bg-surface px-[14px] py-[13px] text-[14.5px] text-text outline-none transition-colors placeholder:text-text-3 focus:border-accent ${className}`}
        {...props}
      />
    </label>
  );
});
