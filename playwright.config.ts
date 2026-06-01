import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // The stateful test pack (tests/e2e/pack/**) seeds users and must NEVER run
  // against production — it has its own config (playwright.tests.config.ts).
  // Exclude it from this prod-smoke config.
  testIgnore: "**/pack/**",
  timeout: 30_000,
  retries: 1,
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }], ["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://aicareermentor.co.uk",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 14"] },
    },
  ],
});
