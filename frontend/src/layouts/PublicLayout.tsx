import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/Button';

export function PublicLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] backdrop-blur-[14px]">
        <div className="mx-auto flex max-w-landing items-center justify-between px-5 py-3.5">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-4">
            <a href="/#features" className="hidden text-[14px] font-semibold text-text-2 hover:text-text sm:block">
              Funciones
            </a>
            <a href="/#pricing" className="hidden text-[14px] font-semibold text-text-2 hover:text-text sm:block">
              Precios
            </a>
            <ThemeToggle />
            <Link to="/login" className="text-[14px] font-semibold text-text-2 hover:text-text">
              Iniciar sesión
            </Link>
            <Button size="sm" onClick={() => navigate('/register')}>
              Empezar gratis
            </Button>
          </nav>
        </div>
      </header>

      <Outlet />

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-landing flex-col items-center gap-3 px-5 text-center">
          <Logo size={28} />
          <p className="text-[13px] text-text-3">
            © 2026 Fortiva · Hecho con cuidado para tu hogar
          </p>
        </div>
      </footer>
    </div>
  );
}
