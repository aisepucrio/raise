import { defineConfig, devices } from '@playwright/test';

/**
 * RAISE Playwright configuration.
 *
 * Prerequisites before running tests:
 *   make infra-up   (full stack required)
 *   make infra-ps   (verify all services are Up)
 *
 * Run commands:
 *   make test-e2e   — Full-stack pipeline tests (Docker required)
 */
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/screenshots',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      // Full-stack pipeline tests. Requires Docker compose stack running.
      name: 'e2e',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
