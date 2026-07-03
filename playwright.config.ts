import { defineConfig, devices } from '@playwright/test';

// End-to-end test configuration.
//
// The e2e suite drives the real stack: the Vite dev server (client), the Express
// API (server), and PostgreSQL. Postgres must already be running (e.g. via
// `docker compose up -d db`); the client and server dev servers are started
// automatically below unless something is already listening on their ports.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: [
    {
      command: 'npm run dev:server',
      url: 'http://localhost:4000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    }
  ]
});
