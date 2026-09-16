/**
 * Seeds each candidate persona in the test Clerk instance, signs them in via
 * Clerk's official Playwright helper, and persists the authenticated session to
 * a per-persona storageState file. Specs load that state instead of signing in
 * every test — fast, and it exercises the real middleware.
 */
import { test as setup, type Page } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { PrismaClient } from "@prisma/client";
import { CANDIDATE_PERSONAS, CORPORATE_ADMIN, DISPOSABLE_CANDIDATE } from "../fixtures/personas";
import { TEST_PASSWORD, statePath } from "../fixtures/env";
import { seedPersona } from "../fixtures/seedClerkUser";
import { seedCompany } from "../fixtures/seedCompany";

const prisma = new PrismaClient();

/** The standing candidate personas represent ESTABLISHED users, so they are
 *  seeded as already-onboarded — /practice now redirects anyone who has never
 *  completed or skipped onboarding (the Stripe-return gate). The disposable
 *  persona is deliberately NOT stamped: onboarding.spec needs a fresh user. */
async function stampOnboarded(clerkUserId: string) {
  await prisma.userProfile.upsert({
    where: { clerkUserId },
    update: { onboardingCompletedAt: new Date() },
    create: { clerkUserId, onboardingCompletedAt: new Date() },
  });
}

/**
 * Answer the cookie notice before anything navigates.
 *
 * The dialog floats at z-[9999] and intercepts clicks on controls underneath
 * it, so every persona's saved state needs it already dismissed. This used to
 * be a page.evaluate() after landing on /practice, which raced any redirect
 * that page issues - the disposable persona is deliberately not onboarding
 * stamped, so /practice bounces it to onboarding and destroyed the execution
 * context mid-evaluate. An init script runs on every navigation instead, so
 * there is no window to lose.
 */
async function seedCookieConsent(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("aim_cookie_consent", "essential");
    } catch {
      // Private-mode style storage failures are not this helper's problem.
    }
  });
}

for (const persona of CANDIDATE_PERSONAS) {
  setup(`seed + sign in: ${persona.key}`, async ({ page }) => {
    const user = await seedPersona(persona);
    await stampOnboarded(user.id);

    await seedCookieConsent(page);

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

setup(`seed + sign in: ${CORPORATE_ADMIN.key}`, async ({ page }) => {
  const user = await seedPersona(CORPORATE_ADMIN);
  await stampOnboarded(user.id);
  // The corporate dashboard reads the company via the signed-in user's
  // CompanyMember — seed a Company + admin member + AC template in the test DB.
  await seedCompany(user.id);

  await seedCookieConsent(page);

  await page.goto("/");
  await clerk.signIn({
    page,
    signInParams: { strategy: "password", identifier: CORPORATE_ADMIN.email, password: TEST_PASSWORD },
  });

  await page.goto("/company/dashboard");
  await page.context().storageState({ path: statePath(CORPORATE_ADMIN.key) });
});

setup(`seed + sign in: ${DISPOSABLE_CANDIDATE.key}`, async ({ page }) => {
  await seedPersona(DISPOSABLE_CANDIDATE);

  await seedCookieConsent(page);

  await page.goto("/");
  await clerk.signIn({
    page,
    signInParams: { strategy: "password", identifier: DISPOSABLE_CANDIDATE.email, password: TEST_PASSWORD },
  });

  // Not /practice: this persona is deliberately un-onboarded, so that route
  // redirects. The session is already proven by the sign-in above.
  await page.goto("/profile");
  await page.context().storageState({ path: statePath(DISPOSABLE_CANDIDATE.key) });
});
