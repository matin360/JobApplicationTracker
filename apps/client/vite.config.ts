import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the client application.
// This file controls the dev server, path aliases, and client-side test setup.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const apiProxyTarget = env.VITE_API_URL || 'http://localhost:4000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    // Dev server proxy forwards API requests to the configured backend URL.
    // This allows both `VITE_API_URL` and the relative path proxy to work.
    server: {
      port: Number(env.VITE_PORT || 3000),
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
          ws: false
        }
      }
    },
    // Vitest client test settings.
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './test/setup.ts'
    }
  };
});
