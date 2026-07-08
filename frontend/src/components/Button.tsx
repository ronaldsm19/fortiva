import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center gap-2 font-bold rounded-input transition-[transform,box-shadow,background] duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink shadow-sm hover:shadow',
  secondary: 'bg-surface text-text border border-border-strong hover:shadow-sm',
  ghost: 'bg-transparent text-text-2 hover:bg-surface-2',
  success: 'bg-pos text-white shadow-sm hover:shadow',
};

const sizes: Record<Size, string> = {
  sm: 'text-[13px] px-3 py-2',
  md: 'text-[14px] px-4 py-2.5',
  lg: 'text-[15px] px-5 py-3',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', className = '', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});
