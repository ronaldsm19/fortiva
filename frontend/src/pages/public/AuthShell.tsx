import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface Props {
  title: string; // título del panel de marca (Instrument Serif)
  bullets: string[];
  children: ReactNode; // formulario
}

/** Layout dos columnas: panel de marca (gradiente) + formulario premium. */
export function AuthShell({ title, bullets, children }: Props) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca */}
      <div
        className="relative hidden flex-col justify-between p-12 text-white lg:flex"
        style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))' }}
      >
        <Link to="/" className="[&_span]:text-white">
          <Logo />
        </Link>
        <div>
          <h2 className="font-serif text-[40px] leading-tight">{title}</h2>
          <ul className="mt-8 flex flex-col gap-4">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-3 text-[15px] opacity-95">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20">
                  <Check size={14} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[13px] opacity-80">© 2026 Fortiva</p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center bg-bg px-5 py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-6 lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
