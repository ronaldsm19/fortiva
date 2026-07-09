import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 5173 },
  build: {
    // El chunk inicial ya baja a ~25 kB. El único vendor que supera 500 kB es el
    // registro de iconos de lucide (Icon.tsx los resuelve por nombre en runtime):
    // vive en su propio chunk y se carga on-demand solo bajo /app, nunca en el
    // arranque ni en el landing. Subimos el umbral para que el warning deje de
    // señalar ese chunk diferido; adelgazar lucide requiere rediseñar Icon.tsx
    // (tree-shaking de iconos), fuera del alcance de este issue.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Separa los vendors pesados en chunks propios para aligerar el chunk
        // inicial. El orden de carga lo resuelve Rollup por el grafo de imports
        // ESM, así que agrupar aquí no lo rompe.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/framer-motion/')) return 'framer-motion';
          // Icon.tsx resuelve iconos por nombre desde el registro completo de
          // lucide, así que va a su propio chunk (solo se carga bajo /app).
          if (id.includes('/lucide-react/')) return 'lucide';
          // recharts arrastra d3 y utilidades de gráficos: al mismo chunk.
          if (
            id.includes('/recharts/') ||
            id.includes('/recharts-scale/') ||
            id.includes('/react-smooth/') ||
            id.includes('/victory-vendor/') ||
            id.includes('/internmap/') ||
            id.includes('/d3-')
          ) {
            return 'recharts';
          }
          // Núcleo de React/Router en un solo chunk cacheable y compartido.
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router/') ||
            id.includes('/react-router-dom/') ||
            id.includes('/scheduler/')
          ) {
            return 'react-vendor';
          }
        },
      },
    },
  },
});
