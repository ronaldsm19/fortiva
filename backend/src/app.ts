import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from '@/config/env';
import { openApiSpec } from '@/config/swagger';
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware';
import { authRoutes } from '@/modules/auth/auth.routes';
import { accountsRoutes } from '@/modules/accounts/accounts.routes';
import { movementsRoutes } from '@/modules/movements/movements.routes';
import { categoriesRoutes } from '@/modules/categories/categories.routes';
import { debtsRoutes } from '@/modules/debts/debts.routes';
import { remindersRoutes } from '@/modules/reminders/reminders.routes';
import { networthRoutes } from '@/modules/networth/networth.routes';
import { assetsRoutes } from '@/modules/assets/assets.routes';
import { reportsRoutes } from '@/modules/reports/reports.routes';
import { placeholderRoutes } from '@/modules/placeholders.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());

  // Rate limit básico sobre la API.
  app.use(
    '/api',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }),
  );

  // Healthcheck
  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  // Docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // API v1
  const v1 = express.Router();
  v1.use(authRoutes);
  v1.use(accountsRoutes);
  v1.use(movementsRoutes);
  v1.use(categoriesRoutes);
  v1.use(debtsRoutes);
  v1.use(remindersRoutes);
  v1.use(networthRoutes);
  v1.use(assetsRoutes);
  v1.use(reportsRoutes);
  v1.use(placeholderRoutes); // solo /integrations (Fase 7)
  app.use('/api/v1', v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
