import { defineConfig, devices } from "@playwright/test";
// Reuses the test-pack's production guard + fixtures. Capture runs against the
// LOCAL dev server with AIM_TEST_MODE=mock and the seeded demo personas, so the
// shots show the real UI with clean, controlled data (never production/real users).
import { BASE_URL } from "./tests/e2e/pack/fixtures/env";

const useLocalServer = /localhost|127\.0\.0\.1/.test(BASE_URL);

// Retina, marketing-friendly framing.
const shot = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 } as const;

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
      name: "capture",
      testDir: "./tests/e2e/capture",
      testMatch: /\.capture\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        ...shot,
        // Synthetic mic/camera so the voice+camera capture runs without hardware.
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
          command: "npm run dev",
          url: "http://localhost:3000",
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
