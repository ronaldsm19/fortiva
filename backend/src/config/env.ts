import 'dotenv/config';
import { z } from 'zod';

/** Validación de variables de entorno al arrancar (falla rápido si faltan). */
const schema = z.object({
  DATABASE_URL: z
    .string()
    .refine((v) => v.startsWith('mongodb://') || v.startsWith('mongodb+srv://'), {
      message: 'DATABASE_URL debe ser una cadena de conexión de MongoDB',
    }),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET muy corto'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET muy corto'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  TRIAL_DAYS: z.coerce.number().default(7),

  // SMTP (opcional): si falta, los correos no se envían pero la operación no falla.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // URL pública del frontend (para los enlaces de los correos).
  APP_URL: z.string().default('http://localhost:5173'),

  // Secreto que protege el endpoint /jobs/reminders. Vercel Cron lo envía
  // automáticamente como `Authorization: Bearer <CRON_SECRET>`. Si no se define,
  // el endpoint queda abierto (solo recomendable en local).
  CRON_SECRET: z.string().optional(),

  // TC (colones por USD) de respaldo si el BCCR no responde al crear un movimiento.
  FX_FALLBACK: z.coerce.number().default(505),

  // Web service oficial del BCCR para el TC HISTÓRICO por fecha (issue #1): un movimiento
  // con fecha pasada usa el TC de ESA fecha (indicadores 317 compra / 318 venta). Requiere
  // registrarse en el BCCR para obtener el correo + token. OPCIONALES: si faltan,
  // `getFxRateForDate` cae al TC del día. Alta del token documentada en DEPLOY.md.
  BCCR_WS_EMAIL: z.string().optional(),
  BCCR_WS_TOKEN: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuración de entorno inválida. Revisa tu archivo .env');
}

export const env = parsed.data;
