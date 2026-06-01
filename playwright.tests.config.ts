import { defineConfig, devices } from "@playwright/test";
// Importing env.ts runs the PRODUCTION guard at config-load time — the pack
// refuses to start if PLAYWRIGHT_BASE_URL points at the live site.
import { BASE_URL } from "./tests/e2e/pack/fixtures/env";

/**
 * Stateful test-pack config — SEPARATE from playwright.config.ts (which runs the
 * prod smoke suite). This one seeds Clerk users and runs simulated interviews,
 * so it targets a local dev server or a Vercel preview, never production.
 *
 * Run:  npm run test:pack        (mocked AI, deterministic, ~free)
 * The app under test MUST run with AIM_TEST_MODE=mock (the webServer below sets
 * it for local runs; for a preview deployment, set it in that env).
 */
const useLocalServer = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e/pack",
  timeout: 90_000,
  // @clerk/testing is documented to be unreliable with concurrent workers.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testDir: "./tests/e2e/pack/setup",
      testMatch: /global\.setup\.ts/,
      teardown: "cleanup",
    },
    {
      name: "auth",
      testDir: "./tests/e2e/pack/setup",
      testMatch: /auth\.setup\.ts/,
      dependencies: ["setup"],
    },
    {
      name: "chromium",
      testDir: "./tests/e2e/pack/specs",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["auth"],
    },
    {
      name: "cleanup",
      testDir: "./tests/e2e/pack/setup",
      testMatch: /teardown\.ts/,
    },
  ],
  ...(useLocalServer
    ? {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 120_000,
          // Boot the app with the AI mock seam ON so the suite is deterministic
          // and needs no OpenAI key.
          env: { AIM_TEST_MODE: "mock" },
        },
      }
    : {}),
});
