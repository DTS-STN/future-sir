import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/',
  snapshotPathTemplate: '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  use: {
    baseURL: `http://localhost:3000/`,
  },
  webServer: {
    command: 'tsx --import ./app/.server/telemetry.ts ./app/.server/express/server.ts',
    reuseExistingServer: !process.env.CI,
    url: `http://localhost:3000/`,
  },
});
