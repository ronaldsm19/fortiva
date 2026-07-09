import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Config de Vitest para el backend. Tests UNITARIOS: sin BD ni red.
export default defineConfig({
  resolve: {
    // Mismo alias que tsconfig ("@/*" -> "src/*") para que los imports resuelvan.
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Variables de entorno mínimas para que `config/env.ts` valide al importar
    // (los tests no conectan a la BD ni firman con secretos reales).
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'mongodb://localhost:27017/fortiva_test',
      JWT_ACCESS_SECRET: 'test_access_secret_0123456789',
      JWT_REFRESH_SECRET: 'test_refresh_secret_0123456789',
      FX_FALLBACK: '505',
    },
  },
});
