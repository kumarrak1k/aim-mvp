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
 *       npm run test:pack:real   (@real-ai tests against the real OpenAI API)
 * The app under test runs with AIM_TEST_MODE=mock by default; test:pack:real
 * sets AIM_TEST_MODE=real (and forwards OPENAI_API_KEY) to exercise the live
 * parsers. NOTE: reuseExistingServer is on, so stop any running dev server first
 * — otherwise a real run would reuse a server still booted in mock mode.
 */
// Boot a local dev server whenever we're targeting localhost — whether that's
// the default or an explicit PLAYWRIGHT_BASE_URL=http://localhost:3000. For a
// remote preview URL, don't boot one — run against that deployment instead.
const useLocalServer = /localhost|127\.0\.0\.1/.test(BASE_URL);

// Forward any STRIPE_* vars (secret key + price IDs) to the app under test, so
// the optional @stripe checkout suite can create sessions in Stripe TEST mode.
// Empty when none are set, so the suite simply skips.
const stripeEnv: Record<string, string> = Object.fromEntries(
  Object.entries(process.env)
    .filter(([k]) => k.startsWith("STRIPE_"))
    .map(([k, v]) => [k, v ?? ""]),
);

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
      use: {
        ...devices["Desktop Chrome"],
        // Synthetic mic/camera so the voice + camera interview specs run without
        // real hardware (inert for the other specs, which request no media).
        launchOptions: {
          args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
        },
      },
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
          // Boot the app with the AI mock seam ON, and forward the TEST Clerk
          // instance + DB so the app-under-test and the test process use the
          // SAME instance. These come from .env.test via:
          //   npx dotenv-cli -e .env.test -- npm run test:pack
          // so only .env.test is needed (no .env.local juggling).
          env: {
            // Mock by default (deterministic, ~free). test:pack:real sets
            // AIM_TEST_MODE=real, which routes through the real OpenAI API.
            AIM_TEST_MODE: process.env.AIM_TEST_MODE ?? "mock",
            OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
            CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ?? "",
            CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? "",
            DATABASE_URL: process.env.DATABASE_URL ?? "",
            ...stripeEnv,
          },
        },
      }
    : {}),
});
