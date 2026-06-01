/**
 * Environment resolution + a hard PRODUCTION guard for the stateful test pack.
 *
 * The pack SEEDS Clerk users and runs interviews, so it must never point at the
 * live site. This module throws at import time if PLAYWRIGHT_BASE_URL looks like
 * production — which fails the Playwright config load before anything runs.
 */

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

if (/aicareermentor\.co\.uk/i.test(BASE_URL)) {
  throw new Error(
    `Refusing to run the stateful test pack against PRODUCTION (${BASE_URL}). ` +
      "Point PLAYWRIGHT_BASE_URL at a local dev server or a Vercel preview deployment.",
  );
}

/** Password used for every seeded persona login. Override via env in CI. */
export const TEST_PASSWORD = process.env.AIM_TEST_PASSWORD || "Test-Passw0rd!2026";

/** Where per-persona Clerk storageState JSON is written (gitignored). */
export function statePath(key: string): string {
  return `tests/e2e/pack/.auth/${key}.json`;
}
