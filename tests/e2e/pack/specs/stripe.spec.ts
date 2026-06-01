/**
 * Stripe checkout (TEST MODE only) — verifies the candidate and corporate
 * checkout routes create a real Stripe Checkout Session and return a hosted
 * checkout URL. This exercises session creation + price wiring with live test
 * keys; it does NOT drive Stripe's hosted card page or the webhook→entitlement
 * path (those are the manual test-mode checklist in GO-LIVE.md).
 *
 * SAFETY: every test skips unless STRIPE_SECRET_KEY is an sk_test_ key, so this
 * can never touch live Stripe. It's also excluded from the default pack
 * (test:pack uses --grep-invert @stripe); run it with `npm run test:pack:stripe`
 * after configuring sk_test_ + the STRIPE_PRICE_* test price IDs.
 */
import { test, expect } from "@playwright/test";
import { statePath } from "../fixtures/env";
import { CORPORATE_ADMIN } from "../fixtures/personas";

const STRIPE_TEST_MODE = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;

test.describe("stripe checkout (test mode)", () => {
  test.skip(
    !STRIPE_TEST_MODE,
    "Set a sk_test_ STRIPE_SECRET_KEY + STRIPE_PRICE_* test price IDs in .env.test to run.",
  );

  test.describe("candidate", () => {
    test.use({ storageState: statePath("free") });

    test("creates a subscription checkout session for plus_monthly", { tag: "@stripe" }, async ({ page }) => {
      const res = await page.request.post("/api/stripe/checkout", { data: { planId: "plus_monthly" } });
      expect(res.status(), await res.text()).toBe(200);
      const { url } = await res.json();
      expect(url).toContain("checkout.stripe.com");
    });
  });

  test.describe("corporate", () => {
    test.use({ storageState: statePath(CORPORATE_ADMIN.key) });

    test("creates a subscription checkout session for the team plan", { tag: "@stripe" }, async ({ page }) => {
      const res = await page.request.post("/api/company/checkout", { data: { billing: "monthly" } });
      expect(res.status(), await res.text()).toBe(200);
      const { url } = await res.json();
      expect(url).toContain("checkout.stripe.com");
    });
  });
});
