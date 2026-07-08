import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Input } from '@/components/Input';
import { PasswordInput } from '@/components/PasswordInput';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Bienvenido de vuelta a tu hogar."
      bullets={['Tu mes, siempre claro', 'Recordatorios a tiempo', 'Decisiones en pareja']}
    >
      <h1 className="text-[26px] font-extrabold tracking-tight">Iniciar sesión</h1>
      <p className="mb-6 mt-1 text-[14px] text-text-2">Entra para ver cómo va el mes.</p>

      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="ana@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-text-2">Contraseña</span>
            <Link to="/forgot-password" className="text-[12.5px] font-semibold text-accent">¿Olvidaste tu contraseña?</Link>
          </div>
          <PasswordInput
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="rounded-input bg-neg-weak px-4 py-3 text-[13px] font-semibold text-neg">
            {error}
          </div>
        )}

        <div className="flex items-start gap-3 rounded-input bg-accent-weak px-4 py-3">
          <KeyRound size={18} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-[13px] text-text-2">
            ¿Primer ingreso? Te pediremos crear una nueva contraseña por seguridad.
          </p>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13.5px] text-text-2">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-bold text-accent">
          Regístrate
        </Link>
      </p>
    </AuthShell>
  );
}
