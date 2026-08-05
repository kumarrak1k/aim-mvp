/**
 * The full six-step onboarding, ending at the equipment check.
 *
 * This flow silently died once already (the signup path hardcoded a landing
 * page that bypassed it — see postAuthDestination), so it gets a spec that
 * walks it end to end. The equipment check is asserted for real: Chromium's
 * fake media device emits a tone, so the mic meter genuinely passes.
 *
 * Uses the disposable persona because completing onboarding writes profile
 * fields (target role, process type) that must not leak into other specs.
 */
import { test, expect } from "@playwright/test";
import { statePath } from "../fixtures/env";

test.describe("candidate onboarding", () => {
  test.use({ storageState: statePath("disposable") });

  test("walks all six steps and reaches practice via the equipment check", async ({ page }) => {
    await page.goto("/onboarding");

    // Step 1 — who they are
    await expect(page.getByText("Step 1 of 6")).toBeVisible();
    await page.getByPlaceholder(/Operations Analyst/i).fill("Graduate Software Engineer");
    await page.getByRole("button", { name: /Graduate or first role/ }).click();
    await page.getByRole("button", { name: "Technology & data" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 2 — process type
    await page.getByRole("button", { name: /A competency interview/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3 — biggest challenge (saves to the API on advance)
    await page.getByRole("button", { name: /answers wander off the question/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 4 — the plan give-back
    await expect(page.getByText("Your plan")).toBeVisible();
    await page.getByRole("button", { name: "Looks right" }).click();

    // Step 5 — launch choice hands off to the equipment check, not straight out
    await page.getByRole("button", { name: /Start the warm-up/ }).click();

    // Step 6 — equipment check
    await expect(page.getByRole("heading", { name: "Quick equipment check" })).toBeVisible();
    await expect(page.getByText("Step 6 of 6")).toBeVisible();

    // REGRESSION (2026-08-05): a refresh here (e.g. after plugging in a new
    // camera) must NOT dump the candidate into practice with the flow
    // unfinished — completion is only stamped when the equipment check hands
    // off. The saved answers resume the flow at the plan (step 4).
    await page.reload();
    await expect(page.getByText("Your plan")).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/onboarding/);
    await page.getByRole("button", { name: "Looks right" }).click();
    await page.getByRole("button", { name: /Start the warm-up/ }).click();
    await expect(page.getByRole("heading", { name: "Quick equipment check" })).toBeVisible();

    // The fake mic emits a tone, so the meter should genuinely register a pass.
    await page.getByRole("button", { name: "Test microphone" }).click();
    await expect(page.getByText("Working").first()).toBeVisible({ timeout: 15_000 });

    // The skip path must always exist — typed practice needs no equipment.
    await page.getByRole("button", { name: /Skip the check/ }).click();
    await page.waitForURL(/\/practice\?warmup=1/);
  });
});
