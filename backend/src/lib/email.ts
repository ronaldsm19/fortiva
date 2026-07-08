import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '@/config/env';

/**
 * Envío de correo con SMTP (nodemailer). Reutiliza el patrón de vendefacilcr:
 * transporter perezoso y `sendMail` que NUNCA lanza (si SMTP no está configurado
 * o falla, se registra y se sigue). Las credenciales viven en el .env (SMTP_*).
 */
let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false, // 587 usa STARTTLS
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const tx = getTransporter();
  if (!tx) {
    console.warn('[email] SMTP no configurado (SMTP_HOST/USER/PASS); correo NO enviado:', opts.subject);
    return { ok: false, error: 'SMTP no configurado' };
  }
  try {
    await tx.sendMail({
      from: `Fortiva <${env.SMTP_USER}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return { ok: true };
  } catch (error) {
    console.error('[email] Error enviando correo:', opts.subject, error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ── Plantilla HTML de marca Fortiva ───────────────────────────────
const ACCENT = '#2456C9';
const ACCENT_STRONG = '#183F9C';

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(40,33,24,.08);">
        <tr><td style="background:linear-gradient(135deg,${ACCENT},${ACCENT_STRONG});padding:32px;text-align:center;">
          <div style="display:inline-block;width:52px;height:52px;border-radius:13px;background:#fff;color:${ACCENT};font-size:26px;font-weight:800;line-height:52px;">F</div>
          <h1 style="margin:14px 0 0;color:#fff;font-size:22px;font-weight:800;">${title}</h1>
        </td></tr>
        <tr><td style="padding:32px;color:#211E1A;font-size:15px;line-height:1.6;">${bodyHtml}</td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #EAE3D8;text-align:center;color:#9A9184;font-size:12px;">
          Fortiva — Finanzas de hogar, en calma.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function invitePartnerEmailHtml(p: {
  partnerName: string;
  inviterName: string;
  householdName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 16px;">¡Hola <strong>${p.partnerName}</strong>! 💙</p>
    <p style="margin:0 0 20px;">
      <strong>${p.inviterName}</strong> te invitó a administrar juntos las finanzas del hogar
      <strong>${p.householdName}</strong> en Fortiva. Ya tienes acceso completo a la cuenta.
    </p>
    <div style="margin:24px 0;padding:18px 20px;background:#EAF0FF;border:1px solid #D6E0FF;border-radius:12px;">
      <p style="margin:0 0 8px;font-size:13px;color:#6B6459;">Usuario (correo)</p>
      <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#211E1A;">${p.email}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#6B6459;">Contraseña temporal</p>
      <p style="margin:0;font-size:20px;font-weight:800;letter-spacing:1px;color:${ACCENT};font-family:monospace;">${p.tempPassword}</p>
    </div>
    <a href="${p.loginUrl}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:11px;">Entrar a Fortiva</a>
    <p style="margin:20px 0 0;font-size:13px;color:#9A9184;">
      🔒 Por seguridad, entra y cambia tu contraseña desde <em>Cuenta → Cambiar contraseña</em> en tu primer ingreso.
    </p>`;
  return layout('Te invitaron a un hogar en Fortiva', body);
}

export function welcomeTrialEmailHtml(p: {
  name: string;
  loginUrl: string;
  trialDays: number;
}): string {
  const body = `
    <p style="margin:0 0 16px;">¡Hola <strong>${p.name}</strong>! 🎉</p>
    <p style="margin:0 0 20px;">
      Tu cuenta de Fortiva ya está lista y tu <strong>prueba gratis de ${p.trialDays} días</strong> está activa.
      Registra tus ingresos, gastos y deudas, e invita a tu pareja cuando quieras.
    </p>
    <a href="${p.loginUrl}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:11px;">Entrar a Fortiva</a>
    <p style="margin:20px 0 0;font-size:13px;color:#9A9184;">
      7 días gratis · Sin tarjeta · Cancela cuando quieras.
    </p>`;
  return layout('¡Bienvenido a Fortiva!', body);
}

/** Correo para cuentas provisionadas (p. ej. plan pagado) con contraseña generada. */
export function provisionedAccountEmailHtml(p: {
  name: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
  plan?: string;
}): string {
  const body = `
    <p style="margin:0 0 16px;">¡Hola <strong>${p.name}</strong>! 🎉</p>
    <p style="margin:0 0 20px;">
      Tu cuenta de Fortiva${p.plan ? ` (plan <strong>${p.plan}</strong>)` : ''} ya está activa.
      Estos son tus accesos:
    </p>
    <div style="margin:24px 0;padding:18px 20px;background:#EAF0FF;border:1px solid #D6E0FF;border-radius:12px;">
      <p style="margin:0 0 8px;font-size:13px;color:#6B6459;">Usuario (correo)</p>
      <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#211E1A;">${p.email}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#6B6459;">Contraseña temporal</p>
      <p style="margin:0;font-size:20px;font-weight:800;letter-spacing:1px;color:${ACCENT};font-family:monospace;">${p.tempPassword}</p>
    </div>
    <a href="${p.loginUrl}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:11px;">Entrar a Fortiva</a>
    <p style="margin:20px 0 0;font-size:13px;color:#9A9184;">
      🔒 En tu primer ingreso te pediremos <strong>cambiar la contraseña</strong> por seguridad.
    </p>`;
  return layout('Tu cuenta de Fortiva está lista', body);
}

export function reminderDueEmailHtml(p: {
  name: string;
  issuer: string;
  amountStr: string;
  due: string;
}): string {
  const body = `
    <p style="margin:0 0 16px;">Recordatorio de pago próximo ⏰</p>
    <div style="margin:16px 0;padding:18px 20px;background:#F8E9E3;border:1px solid #F0D5CC;border-radius:12px;">
      <p style="margin:0 0 6px;font-size:17px;font-weight:800;color:#211E1A;">${p.name}</p>
      <p style="margin:0 0 10px;font-size:13px;color:#6B6459;">${p.issuer} · vence ${p.due}</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:${ACCENT};">${p.amountStr}</p>
    </div>
    <p style="margin:0;font-size:13px;color:#9A9184;">
      Puedes marcarlo como pagado o ajustar el recordatorio desde Fortiva.
    </p>`;
  return layout('Tienes un pago próximo', body);
}

export function resetPasswordEmailHtml(p: { name: string; resetUrl: string }): string {
  const body = `
    <p style="margin:0 0 16px;">Hola <strong>${p.name}</strong>,</p>
    <p style="margin:0 0 20px;">
      Recibimos una solicitud para restablecer tu contraseña de Fortiva. Haz clic en el botón
      para crear una nueva. Este enlace vence en <strong>1 hora</strong>.
    </p>
    <a href="${p.resetUrl}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:11px;">Restablecer contraseña</a>
    <p style="margin:20px 0 0;font-size:13px;color:#9A9184;">
      Si no fuiste tú, ignora este correo; tu contraseña seguirá igual.
    </p>`;
  return layout('Restablece tu contraseña', body);
}
