import cron from 'node-cron';
import { prisma } from '@/config/prisma';
import { reminderDueEmailHtml, sendMail } from '@/lib/email';
import { centsToUsd, fmtDayMon } from '@/lib/present';
import { env } from '@/config/env';

const DAYS_AHEAD = 3; // avisa cuando falten ≤3 días
const RENOTIFY_MS = 20 * 60 * 60 * 1000; // no re-notificar dentro de 20h

/**
 * Busca recordatorios pendientes con correo activado que vencen pronto y envía
 * el aviso a los miembros del hogar. Guarda `lastNotifiedAt` para no duplicar.
 * Exportada para poder ejecutarla manualmente (pruebas).
 */
export async function runReminderNotifications(): Promise<{ checked: number; sent: number }> {
  const now = new Date();
  const limit = new Date(now.getTime() + DAYS_AHEAD * 86400000);

  const due = await prisma.reminder.findMany({
    where: { status: 'pending', emailEnabled: true, dueDate: { lte: limit } },
    include: { account: { include: { users: true } } },
  });

  let sent = 0;
  for (const r of due) {
    // Anti-duplicado (verificado en código por el manejo de null en MongoDB)
    if (r.lastNotifiedAt && now.getTime() - r.lastNotifiedAt.getTime() < RENOTIFY_MS) continue;
    const emails = r.account.users.map((u) => u.email).filter(Boolean);
    if (emails.length === 0) continue;

    const res = await sendMail({
      to: emails.join(','),
      subject: `Recordatorio: ${r.name} vence ${fmtDayMon(r.dueDate)}`,
      html: reminderDueEmailHtml({
        name: r.name,
        issuer: r.issuer,
        amountStr: '$' + centsToUsd(r.amountCents).toLocaleString('en-US'),
        due: fmtDayMon(r.dueDate),
      }),
    });
    if (res.ok) {
      await prisma.reminder.update({ where: { id: r.id }, data: { lastNotifiedAt: now } });
      sent++;
    }
  }
  return { checked: due.length, sent };
}

/** Programa el job diario (8:00). Solo si SMTP está configurado. */
export function startReminderJob() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.log('[reminders job] SMTP no configurado → job de recordatorios desactivado.');
    return;
  }
  cron.schedule('0 8 * * *', () => {
    runReminderNotifications()
      .then((r) => console.log(`[reminders job] revisados ${r.checked}, enviados ${r.sent}`))
      .catch((e) => console.error('[reminders job] error', e));
  });
  console.log('[reminders job] programado (diario 08:00).');
}
