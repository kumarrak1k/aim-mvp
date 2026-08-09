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

    // A working mic and speaker is enough to SPEAK, so the primary button must
    // offer the camera-less path rather than staying disabled and pushing a
    // webcam-less candidate down the typed route.
    await page.getByRole("button", { name: /Play test sound/ }).click();
    await page.getByRole("button", { name: /I heard it/ }).click();
    const primary = page.getByRole("button", { name: /Continue without camera|Everything works/ });
    await expect(primary).toBeEnabled();
    await expect(primary).toHaveText(/Continue without camera/);

    // The skip path must always exist — typed practice needs no equipment.
    await page.getByRole("button", { name: /Skip the check/ }).click();
    await page.waitForURL(/\/practice\?warmup=1/);

    // The exit taken IS the mode decision, and it has to be persisted: the
    // practice screen restores preferredPracticeMode, so a first session opens
    // in the mode the candidate qualified for instead of defaulting to typed.
    const profile = await page.request.get("/api/candidate-profile");
    expect(profile.ok(), await profile.text()).toBe(true);
    const body = await profile.json();
    expect(body.profile.preferredPracticeMode).toBe("typed");
  });
});
