import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { authService } from '@/services/auth';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Recupera el acceso a tu hogar."
      bullets={['Te enviamos un enlace seguro', 'Vence en 1 hora', 'Tus datos siguen cifrados']}
    >
      <h1 className="text-[26px] font-extrabold tracking-tight">¿Olvidaste tu contraseña?</h1>
      <p className="mb-6 mt-1 text-[14px] text-text-2">
        Escribe tu correo y te enviaremos un enlace para crear una nueva.
      </p>

      {sent ? (
        <div className="flex items-start gap-3 rounded-input bg-pos-weak px-4 py-3">
          <MailCheck size={18} className="mt-0.5 shrink-0 text-pos" />
          <p className="text-[13.5px] text-text-2">
            Si <b>{email}</b> tiene una cuenta, te enviamos un enlace para restablecer la contraseña.
            Revisa tu bandeja (y spam).
          </p>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Input label="Correo electrónico" type="email" placeholder="ana@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar enlace'}
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-[13.5px] text-text-2">
        <Link to="/login" className="font-bold text-accent">Volver a iniciar sesión</Link>
      </p>
    </AuthShell>
  );
}
