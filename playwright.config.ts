import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html"], ["github"]] : [["list"]],
  outputDir: "./test-results",

  use: {
    baseURL,
    trace: "on-first-retry",
    // ARVEN is used on a phone, so that is what gets tested.
    ...devices["iPhone 14"],
  },

  projects: [{ name: "mobile-safari", use: { ...devices["iPhone 14"] } }],

  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `pnpm --filter @arven/web start --port ${PORT}`,
        url: `http://127.0.0.1:${PORT}/login`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ARVEN_PASSPHRASE: "test-passphrase",
          ARVEN_SESSION_SECRET: "test-session-secret",
          DATABASE_URL: process.env.DATABASE_URL ?? "",
        },
      },
});
