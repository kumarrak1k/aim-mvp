/**
 * Self-serve account deletion (UK GDPR Art. 17) — /api/account/delete. Locks the
 * two guards (a typed confirmation is required; workspace admins must delete the
 * workspace first) and the destructive purge itself, which a throwaway persona
 * (DISPOSABLE_CANDIDATE) absorbs so the shared personas survive the run.
 */
import { test, expect } from "@playwright/test";
import { statePath } from "../fixtures/env";
import { CORPORATE_ADMIN, DISPOSABLE_CANDIDATE } from "../fixtures/personas";

test.describe("account deletion", () => {
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
