import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { PasswordInput } from '@/components/PasswordInput';
import { Button } from '@/components/Button';
import { authService } from '@/services/auth';

export function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pw.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (pw !== confirm) return setError('Las contraseñas no coinciden.');
    setSubmitting(true);
    try {
      await authService.resetPassword(token, pw);
      setOk(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Crea una contraseña nueva."
      bullets={['Mínimo 8 caracteres', 'Guárdala en un lugar seguro', 'Listo para entrar']}
    >
      <h1 className="text-[26px] font-extrabold tracking-tight">Nueva contraseña</h1>
      <p className="mb-6 mt-1 text-[14px] text-text-2">Elige una contraseña para tu cuenta.</p>

      {!token ? (
        <div className="rounded-input bg-neg-weak px-4 py-3 text-[13px] font-semibold text-neg">
          Falta el token del enlace. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".
        </div>
      ) : ok ? (
        <div className="rounded-input bg-pos-weak px-4 py-3 text-[13px] font-semibold text-pos">
          ✓ Contraseña actualizada. Redirigiendo al inicio de sesión…
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <PasswordInput label="Nueva contraseña" placeholder="Mínimo 8 caracteres" value={pw} onChange={(e) => setPw(e.target.value)} required />
          <PasswordInput label="Confirmar contraseña" placeholder="Repite la contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          {error && <p className="text-[12.5px] font-semibold text-neg">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Restablecer contraseña'}
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-[13.5px] text-text-2">
        <Link to="/login" className="font-bold text-accent">Volver a iniciar sesión</Link>
      </p>
    </AuthShell>
  );
}
