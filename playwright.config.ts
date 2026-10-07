import { defineConfig, devices } from '@playwright/test';

// Porta del dev server Vite usata dagli smoke test E2E.
const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

// Configurazione E2E (Playwright) — viewport mobile con emulazione touch.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      // Dispositivo mobile Chromium (viewport touch); nome progetto = etichetta.
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
