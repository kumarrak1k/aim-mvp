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

    // Step 1 — who they are. The name leads: Clerk's sign-up form doesn't
    // capture one, so onboarding is where the product learns it.
    await expect(page.getByText("Step 1 of 6")).toBeVisible();
    await page.getByPlaceholder(/What should we call you/i).fill("Alex");
    // The picker is a shortcut into the free-text box, not a separate field:
    // whatever it sets must be what gets saved.
    await page.getByRole("combobox").selectOption("Data Analyst");
    await expect(page.getByPlaceholder(/Operations Analyst/i)).toHaveValue("Data Analyst");
    await page.getByPlaceholder(/Operations Analyst/i).fill("Graduate Software Engineer");
    await page.getByRole("button", { name: /Graduate or first role/ }).click();
    await page.getByRole("button", { name: "Technology & data" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 2 — tailoring, its own always-visible step (was a collapsed
    // disclosure nobody opened). Greets by the name just typed; everything on
    // it is optional but must actually reach the profile.
    await expect(
      page.getByRole("heading", { name: /Alex, let's tailor your interview/ })
    ).toBeVisible();
    await page.getByPlaceholder(/Retail supervisor/i).fill("Retail supervisor");
    await page
      .getByPlaceholder(/Paste the job description/i)
      .fill("We are hiring a graduate software engineer to work on payments.");
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3 — process type
    await page.getByRole("button", { name: /A competency interview/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 4 — biggest challenge (saves to the API on advance; the old "your
    // plan" recap step after it was cut — a click without a question)
    await page.getByRole("button", { name: /answers wander off the question/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 5 — launch choice hands off to the equipment check, not straight out
    await page.getByRole("button", { name: /Start the warm-up/ }).click();

    // Step 6 — equipment check
    await expect(page.getByRole("heading", { name: "Quick equipment check" })).toBeVisible();
    await expect(page.getByText("Step 6 of 6")).toBeVisible();

    // REGRESSION (2026-08-05): a refresh here (e.g. after plugging in a new
    // camera) must NOT dump the candidate into practice with the flow
    // unfinished — completion is only stamped when the equipment check hands
    // off. The saved answers resume the flow at the warm-up (step 5).
    await page.reload();
    await expect(
      page.getByRole("button", { name: /Start the warm-up/ })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/onboarding/);
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
    expect(body.profile.currentRole).toBe("Retail supervisor");
    // A pasted job description must LEAD the role spec, not be overwritten by
    // the generated "Target role / Sector / Level" summary.
    expect(body.profile.roleSpec).toMatch(/^We are hiring a graduate software engineer/);
    expect(body.profile.roleSpec).toContain("Target role: Graduate Software Engineer");
  });
});
