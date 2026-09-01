import { defineConfig, devices } from "@playwright/test";
// Light-theme marketing capture for the university outreach one-pagers.
// Same harness as playwright.capture.config.ts (mock AI, seeded personas),
// but the capture spec forces the light theme and the fake camera plays a
// synthetic stock face (tests/e2e/capture/fake-face.y4m) so the voice+camera
// shot shows a person in the camera box without filming anyone real.
import { BASE_URL } from "./tests/e2e/pack/fixtures/env";

// A bare `npx playwright test` leaves the shell without the test-instance
// Clerk keys, so the app boots against whatever .env.local names and every
// persona sign-in fails with "Couldn't find your account" (looks exactly like
// a Clerk rate limit). Refuse to start instead.
if (!process.env.CLERK_SECRET_KEY?.startsWith("sk_test_")) {
  throw new Error("Test env not loaded — run via: npx dotenv-cli -e .env.test -- npx playwright test -c playwright.capture-light.config.ts");
}

const useLocalServer = /localhost|127\.0\.0\.1/.test(BASE_URL);

const shot = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 } as const;

export default defineConfig({
  testDir: "./tests/e2e/capture",
  timeout: 300_000,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: BASE_URL, ...shot },
  projects: [
    { name: "setup", testDir: "./tests/e2e/pack/setup", testMatch: /global\.setup\.ts/ },
    {
      name: "auth",
      testDir: "./tests/e2e/pack/setup",
      testMatch: /auth\.setup\.ts/,
      dependencies: ["setup"],
    },
    {
      name: "demo",
      testDir: "./tests/e2e/capture",
      testMatch: /demo\.setup\.ts$/,
      dependencies: ["auth"],
    },
    {
      name: "capture-light",
      testDir: "./tests/e2e/capture",
      testMatch: /light\.capture\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        ...shot,
        launchOptions: {
          // Default synthetic camera only. Feeding a y4m via
          // --use-file-for-fake-video-capture hung the renderer on Windows;
          // the capture spec overlays the stock face over the live preview
          // box instead, which renders identically in a still screenshot.
          args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
        },
      },
      dependencies: ["demo"],
    },
    {
      name: "capture-journeys",
      testDir: "./tests/e2e/capture",
      testMatch: /journeys\.capture\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        ...shot,
        launchOptions: {
          args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
        },
      },
      dependencies: ["demo"],
    },
  ],
  ...(useLocalServer
    ? {
        webServer: {
          command: `npm run dev -- --port ${new URL(BASE_URL).port || "3000"}`,
          url: BASE_URL,
          reuseExistingServer: true,
          timeout: 120_000,
          env: {
            AIM_TEST_MODE: "mock",
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
            CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ?? "",
            CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? "",
            DATABASE_URL: process.env.DATABASE_URL ?? "",
          },
        },
      }
    : {}),
});
