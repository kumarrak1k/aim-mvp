/**
 * Corporate admin — proves the corporate login works AND the company dashboard
 * renders the seeded company (Company + admin CompanyMember in the test DB).
 * The deeper invite/assign/results flows build on this in a later phase.
 */
import { test, expect } from "@playwright/test";
import { CORPORATE_ADMIN } from "../fixtures/personas";
import { statePath } from "../fixtures/env";

test.describe("corporate admin", () => {
  test.use({ storageState: statePath(CORPORATE_ADMIN.key) });

  test("sees the company dashboard for the seeded company", async ({ page }) => {
    await page.goto("/company/dashboard");
    await expect(page.getByText("AIM Test Co").first()).toBeVisible({ timeout: 20_000 });
  });
});
