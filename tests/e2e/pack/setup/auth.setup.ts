/**
 * Seeds each candidate persona in the test Clerk instance, signs them in via
 * Clerk's official Playwright helper, and persists the authenticated session to
 * a per-persona storageState file. Specs load that state instead of signing in
 * every test — fast, and it exercises the real middleware.
 */
import { test as setup } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { CANDIDATE_PERSONAS } from "../fixtures/personas";
import { TEST_PASSWORD, statePath } from "../fixtures/env";
import { seedPersona } from "../fixtures/seedClerkUser";

for (const persona of CANDIDATE_PERSONAS) {
  setup(`seed + sign in: ${persona.key}`, async ({ page }) => {
    await seedPersona(persona);

    // clerk.signIn() requires a prior navigation to an unprotected page that
    // loads Clerk (the index page).
    await page.goto("/");
    await clerk.signIn({
      page,
      signInParams: { strategy: "password", identifier: persona.email, password: TEST_PASSWORD },
    });

    // Confirm the session is live on a protected route, then persist it.
    await page.goto("/practice");
    await page.context().storageState({ path: statePath(persona.key) });
  });
}
