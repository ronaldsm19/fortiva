import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { PasswordInput } from '@/components/PasswordInput';
import { Badge } from '@/components/Badge';
import { useAuth } from '@/context/AuthContext';

export function Cuenta() {
  const { user, changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk(false);

    if (next.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (next !== confirm) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(current, next);
      setOk(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {/* Perfil */}
      <Card>
        <div className="flex items-center gap-4">
          <div
            className="grid h-14 w-14 place-items-center rounded-full text-[18px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))' }}
          >
            {user?.initials}
          </div>
          <div className="flex-1">
            <div className="text-[17px] font-extrabold">{user?.fullName}</div>
            <div className="text-[13.5px] text-text-2">{user?.email}</div>
            <div className="text-[12.5px] text-text-3">Hogar: {user?.accountName}</div>
          </div>
          {typeof user?.trialDaysLeft === 'number' && (
            <Badge color="var(--accent)" bg="var(--accent-weak)">
              Prueba: {user.trialDaysLeft} días
            </Badge>
          )}
        </div>
      </Card>

      {/* Cambiar contraseña */}
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[11px] bg-accent-weak text-accent">
            <ShieldCheck size={19} />
          </div>
          <div>
            <h2 className="text-[16px] font-extrabold tracking-tight">Cambiar contraseña</h2>
            <p className="text-[13px] text-text-3">Usa una contraseña de al menos 8 caracteres.</p>
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={submit}>
          <PasswordInput
            label="Contraseña actual"
            placeholder="••••••••"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PasswordInput
              label="Nueva contraseña"
              placeholder="Mínimo 8 caracteres"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              required
            />
            <PasswordInput
              label="Confirmar nueva contraseña"
              placeholder="Repite la nueva"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div className="rounded-input bg-neg-weak px-4 py-3 text-[13px] font-semibold text-neg">
              {error}
            </div>
          )}
          {ok && (
            <div className="rounded-input bg-pos-weak px-4 py-3 text-[13px] font-semibold text-pos">
              ✓ Contraseña actualizada correctamente.
            </div>
          )}

          <div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Actualizar contraseña'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
