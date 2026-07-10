import { defineConfig, devices } from "@playwright/test";

const PORT = 7711;
const baseURL = `http://127.0.0.1:${PORT}`;

// Install browsers into node_modules with: npm run test:e2e:install
if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = "0";
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Production server avoids broken/stale dev HMR sessions that block hydration.
    command: "npm run build && npm run start",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
