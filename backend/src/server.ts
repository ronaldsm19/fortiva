import { createApp } from './app';
import { env } from '@/config/env';
import { prisma } from '@/config/prisma';
import { startReminderJob } from './jobs/reminders.job';

async function main() {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Fortiva API en http://localhost:${env.PORT}`);
    console.log(`📚 Swagger docs en http://localhost:${env.PORT}/docs`);
  });

  startReminderJob();

  // Cierre ordenado
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} recibido. Cerrando...`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Fallo al arrancar el servidor:', err);
  process.exit(1);
});
