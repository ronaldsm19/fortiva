import { Link } from 'react-router-dom';

interface Props {
  title: string;
  children: React.ReactNode;
}

function LegalShell({ title, children }: Props) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="mb-6 text-[32px] font-extrabold tracking-tight">{title}</h1>
      <div className="flex flex-col gap-4 text-[14.5px] leading-relaxed text-text-2">{children}</div>
      <Link to="/" className="mt-8 inline-block text-[14px] font-bold text-accent">
        ← Volver al inicio
      </Link>
    </section>
  );
}

export function Terminos() {
  return (
    <LegalShell title="Términos y condiciones">
      <p>
        Bienvenido a Fortiva. Al crear una cuenta aceptas usar el servicio para administrar las
        finanzas de tu hogar de forma personal y no comercial.
      </p>
      <p>
        La prueba gratuita es de 7 días y comienza en tu primer inicio de sesión. Puedes cancelar
        cuando quieras. Eres responsable de la veracidad de los datos que ingreses.
      </p>
      <p className="text-text-3">
        Este es un texto de referencia. Sustitúyelo por los términos legales definitivos antes de
        salir a producción.
      </p>
    </LegalShell>
  );
}

export function Privacidad() {
  return (
    <LegalShell title="Política de privacidad">
      <p>
        En Fortiva tus datos financieros son tuyos. Los almacenamos de forma segura y no los
        vendemos ni compartimos con terceros para publicidad.
      </p>
      <p>
        Puedes solicitar la exportación o eliminación de tus datos en cualquier momento. Usamos tu
        correo únicamente para acceso, recordatorios e invitaciones que tú actives.
      </p>
      <p className="text-text-3">
        Este es un texto de referencia. Sustitúyelo por la política definitiva antes de salir a
        producción.
      </p>
    </LegalShell>
  );
}
