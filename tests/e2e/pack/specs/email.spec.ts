/**
 * One-click email unsubscribe (RFC 8058) — /api/email/unsubscribe/[token].
 * Seeds a marketing-opted-IN preference, POSTs the token UNAUTHENTICATED (as a
 * mail client does), and asserts marketing consent is flipped off. A pure DB
 * round-trip — no AI, no auth, no Clerk user.
 */
import { test, expect } from "@playwright/test";
import { UNSUB_TOKEN, seedEmailPreference, getMarketingConsent } from "../fixtures/seedEmail";

test.describe("email unsubscribe", () => {
  test("one-click unsubscribe flips marketing consent off", async ({ page }) => {
    await seedEmailPreference();
    expect(await getMarketingConsent()).toBe(true);

    const res = await page.request.post(`/api/email/unsubscribe/${UNSUB_TOKEN}`);
    expect(res.status(), await res.text()).toBe(200);

    expect(await getMarketingConsent()).toBe(false);
  });
});
