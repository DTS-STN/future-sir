import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/',
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
    command: 'tsx ./app/.server/express/server.ts',
    reuseExistingServer: !process.env.CI,
    url: `http://localhost:3000/`,
  },
});
