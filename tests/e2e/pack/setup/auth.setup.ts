/**
 * Seeds each candidate persona in the test Clerk instance, signs them in via
 * Clerk's official Playwright helper, and persists the authenticated session to
 * a per-persona storageState file. Specs load that state instead of signing in
 * every test — fast, and it exercises the real middleware.
 */
import { test as setup } from "@playwright/test";
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

for (const persona of CANDIDATE_PERSONAS) {
  setup(`seed + sign in: ${persona.key}`, async ({ page }) => {
    const user = await seedPersona(persona);
    await stampOnboarded(user.id);

    // clerk.signIn() requires a prior navigation to an unprotected page that
    // loads Clerk (the index page).
    await page.goto("/");
    await clerk.signIn({
      page,
      signInParams: { strategy: "password", identifier: persona.email, password: TEST_PASSWORD },
    });

    // Confirm the session is live on a protected route, then persist it.
    await page.goto("/practice");
    // Answer the cookie notice before saving state: the dialog floats at
    // z-[9999] and intercepts clicks on controls underneath it (it swallowed
    // media-release's "Start recording" click). Seeding "essential" here means
    // every spec inherits a dismissed banner instead of each dismissing it.
    await page.evaluate(() => localStorage.setItem("aim_cookie_consent", "essential"));
    await page.context().storageState({ path: statePath(persona.key) });
  });
}

setup(`seed + sign in: ${CORPORATE_ADMIN.key}`, async ({ page }) => {
  const user = await seedPersona(CORPORATE_ADMIN);
  await stampOnboarded(user.id);
  // The corporate dashboard reads the company via the signed-in user's
  // CompanyMember — seed a Company + admin member + AC template in the test DB.
  await seedCompany(user.id);

  await page.goto("/");
  await clerk.signIn({
    page,
    signInParams: { strategy: "password", identifier: CORPORATE_ADMIN.email, password: TEST_PASSWORD },
  });

  await page.goto("/company/dashboard");
  await page.evaluate(() => localStorage.setItem("aim_cookie_consent", "essential"));
  await page.context().storageState({ path: statePath(CORPORATE_ADMIN.key) });
});

setup(`seed + sign in: ${DISPOSABLE_CANDIDATE.key}`, async ({ page }) => {
  await seedPersona(DISPOSABLE_CANDIDATE);

  await page.goto("/");
  await clerk.signIn({
    page,
    signInParams: { strategy: "password", identifier: DISPOSABLE_CANDIDATE.email, password: TEST_PASSWORD },
  });

  await page.goto("/practice");
  await page.evaluate(() => localStorage.setItem("aim_cookie_consent", "essential"));
  await page.context().storageState({ path: statePath(DISPOSABLE_CANDIDATE.key) });
});
