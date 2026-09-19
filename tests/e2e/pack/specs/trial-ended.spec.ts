/**
 * A trial that has ended.
 *
 * The trial takes no card, so nothing converts on its own. This is the whole
 * path to paying for someone whose 3 days are up: they are sent to /upgrade
 * when they come back, can still get to their saved work, and the practice
 * page offers payment instead of a dead Start button.
 *
 * The "free" persona is exactly this account: trial used, ended in 2020,
 * nothing paid.
 */
import { test, expect } from "@playwright/test";
import { statePath } from "../fixtures/env";

test.describe("trial ended", () => {
  test.use({ storageState: statePath("free") });

  test("coming back sends them to pay, once, and they can still reach their work", async ({ page }) => {
    await page.goto("/practice");

    // Sent to the upgrade page, remembering where they were going.
    await expect(page).toHaveURL(/\/upgrade\?next=%2Fpractice/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Your free trial has ended" })).toBeVisible();
    // One plan: a price and a pay button, no tier comparison.
    await expect(page.getByRole("button", { name: /^Subscribe £15 a month$/ })).toBeVisible();
    await page.getByRole("button", { name: /Yearly/ }).click();
    await expect(page.getByRole("button", { name: /^Subscribe £120 a year$/ })).toBeVisible();

    // "Not now" is never a wall, and they are not bounced straight back.
    await page.getByTestId("upgrade-not-now").click();
    await expect(page).toHaveURL(/\/practice$/);

    // On the practice page the main button offers Pro rather than sitting
    // greyed out with nowhere to go.
    const cta = page.getByTestId("continue-with-pro");
    await expect(cta).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /Start Tailored/ })).toHaveCount(0);

    // Moving around the rest of the visit is not interrupted again.
    await page.goto("/progress");
    await expect(page).toHaveURL(/\/progress$/);

  });

  test("the pay button opens checkout for the chosen period, and back returns to the upgrade page", async ({ page }) => {
    let body: Record<string, unknown> | null = null;
    await page.route("**/api/stripe/checkout", async (route) => {
      body = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 200, json: { url: "/upgrade?payment=cancelled" } });
    });

    await page.goto("/upgrade");
    await page.getByRole("button", { name: /Quarterly/ }).click();
    await page.getByRole("button", { name: /^Subscribe £38 a quarter$/ }).click();

    await expect.poll(() => body).toMatchObject({ planId: "pro_quarterly", from: "upgrade" });
    await expect(page.getByText("Checkout was cancelled and nothing was charged.")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("subscribers are never sent to pay", () => {
  test.use({ storageState: statePath("professional") });

  test("a Pro account stays on the page it opened, and /upgrade sends it back to practice", async ({ page }) => {
    await page.goto("/practice");
    await expect(page.getByRole("button", { name: /Start Tailored/ })).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/practice$/);

    await page.goto("/upgrade");
    await expect(page).toHaveURL(/\/practice$/);
  });
});
