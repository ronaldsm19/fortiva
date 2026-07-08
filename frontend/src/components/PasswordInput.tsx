import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

/** Campo de contraseña con botón mostrar/ocultar (ojo). */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { label, className = '', ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[13px] font-semibold text-text-2">{label}</span>
      )}
      <div className="relative">
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          className={`w-full rounded-input border border-border-strong bg-surface px-[14px] py-[13px] pr-11 text-[14.5px] text-text outline-none transition-colors placeholder:text-text-3 focus:border-accent ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-text-3 transition-colors hover:bg-surface-2 hover:text-text"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
});
