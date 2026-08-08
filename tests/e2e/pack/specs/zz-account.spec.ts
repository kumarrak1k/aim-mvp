/**
 * NAMED zz- ON PURPOSE: Playwright runs spec files in alphabetical order, and
 * the disposable candidate DELETES ITSELF below. Any spec that signs in as that
 * persona (onboarding.spec.ts) must run first, or it lands on the sign-in page
 * with a storageState whose user no longer exists.
 *
 * Self-serve account deletion (UK GDPR Art. 17) — /api/account/delete. Locks the
 * two guards (a typed confirmation is required; workspace admins must delete the
 * workspace first) and the destructive purge itself, which a throwaway persona
 * (DISPOSABLE_CANDIDATE) absorbs so the shared personas survive the run.
 */
import { test, expect } from "@playwright/test";
import { statePath } from "../fixtures/env";
import { CORPORATE_ADMIN, DISPOSABLE_CANDIDATE } from "../fixtures/personas";

test.describe("account deletion", () => {
  // The stored __session JWT lives ~60s. This suite now runs at the END of the
  // pack (see the zz- note above), minutes after auth.setup minted those
  // tokens, so a bare page.request would 401 before ever reaching the guard
  // under test. Only a page NAVIGATION triggers the middleware handshake that
  // mints a fresh token, so visit a protected page first.
  // Deliberately asserts only that we are not bounced to sign-in: what the
  // page renders varies by plan and usage state, and the handshake happens on
  // the navigation itself regardless of what is drawn.
  test.beforeEach(async ({ page }) => {
    await page.goto("/practice");
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test.describe("confirmation guard", () => {
    test.use({ storageState: statePath("free") });

    test("rejects deletion without the typed confirmation", async ({ page }) => {
      const res = await page.request.post("/api/account/delete", { data: {} });
      expect(res.status()).toBe(400);
    });
  });

  test.describe("workspace admin", () => {
    test.use({ storageState: statePath(CORPORATE_ADMIN.key) });

    test("blocks a workspace admin from deleting their account", async ({ page }) => {
      const res = await page.request.post("/api/account/delete", { data: { confirm: "DELETE" } });
      expect(res.status()).toBe(409);
    });
  });

  test.describe("disposable candidate", () => {
    test.use({ storageState: statePath(DISPOSABLE_CANDIDATE.key) });

    test("erases a candidate account on confirmation", async ({ page }) => {
      const res = await page.request.post("/api/account/delete", { data: { confirm: "DELETE" } });
      expect(res.status(), await res.text()).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });
  });

  // /api/account/change-password is a backend password set, allowed ONLY for
  // admin-created accounts flagged forcePasswordReset. Both guards are tested
  // non-destructively (a normal persona is refused before any password changes).
  test.describe("forced-password-reset guard", () => {
    test.use({ storageState: statePath("free") });

    test("rejects a too-short new password", async ({ page }) => {
      const res = await page.request.post("/api/account/change-password", { data: { newPassword: "short" } });
      expect(res.status()).toBe(400);
    });

    test("refuses unless the account is flagged for a forced reset", async ({ page }) => {
      const res = await page.request.post("/api/account/change-password", { data: { newPassword: "ValidLongPass123" } });
      expect(res.status()).toBe(403);
    });
  });
});
