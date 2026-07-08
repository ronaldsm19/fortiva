import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Input } from '@/components/Input';
import { PasswordInput } from '@/components/PasswordInput';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: '', nationalId: '', phone: '', email: '', password: '', accountName: '',
  });
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        accountName: form.accountName,
        nationalId: form.nationalId || undefined,
        phone: form.phone || undefined,
      });
      navigate('/app/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Ordena las finanzas de tu hogar, con calma."
      bullets={['Invita a tu pareja por correo', 'Datos cifrados', '7 días gratis, sin tarjeta']}
    >
      <h1 className="text-[26px] font-extrabold tracking-tight">Crea tu cuenta</h1>
      <p className="mb-6 mt-1 text-[14px] text-text-2">Empieza tu prueba gratis de 7 días.</p>

      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Input label="Nombre completo" placeholder="Ana Rodríguez" value={form.fullName} onChange={set('fullName')} required />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Cédula" placeholder="1-2345-6789" value={form.nationalId} onChange={set('nationalId')} />
          <Input label="Teléfono" placeholder="8888-8888" value={form.phone} onChange={set('phone')} />
        </div>
        <Input label="Correo electrónico" type="email" placeholder="ana@correo.com" value={form.email} onChange={set('email')} required />
        <PasswordInput label="Contraseña" placeholder="Mínimo 8 caracteres" value={form.password} onChange={set('password')} required />
        <Input label="Nombre de la cuenta familiar" placeholder="Hogar Rodríguez" value={form.accountName} onChange={set('accountName')} required />

        <label className="flex items-start gap-2 text-[13px] text-text-2">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 accent-[var(--accent)]" />
          <span>
            Acepto los <Link to="/terminos" className="font-semibold text-accent">términos</Link> y la{' '}
            <Link to="/privacidad" className="font-semibold text-accent">política de privacidad</Link>.
          </span>
        </label>

        {error && (
          <div className="rounded-input bg-neg-weak px-4 py-3 text-[13px] font-semibold text-neg">{error}</div>
        )}

        <div className="flex items-start gap-3 rounded-input bg-pos-weak px-4 py-3">
          <MailCheck size={18} className="mt-0.5 shrink-0 text-pos" />
          <p className="text-[13px] text-text-2">
            Te enviaremos una invitación por correo para que tu pareja se una al hogar.
          </p>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={!accepted || submitting}>
          {submitting ? 'Creando…' : 'Crear cuenta y enviar invitación'}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13.5px] text-text-2">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-bold text-accent">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
