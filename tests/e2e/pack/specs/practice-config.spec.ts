/**
 * Practice-session configuration flows through to the API. The setup screen's
 * dropdowns (experience level / interview type / difficulty / focus) are baked
 * into the composite `role` string the client sends to /api/interview
 * (see app/practice/lib/profileHelpers.ts). This asserts the chosen values
 * actually reach the request — i.e. customisation is wired, not just rendered.
 * Deterministic: it inspects the REQUEST, so it's mode-agnostic (no AI needed).
 */
import { test, expect } from "@playwright/test";
import { statePath } from "../fixtures/env";

test.describe("practice session configuration", () => {
  // A paying persona: since the pricing switch, a free account cannot start an
  // interview at all, so the Start button is disabled and no request is sent.
  test.use({ storageState: statePath("professional") });

  test("the selected interview config is sent to /api/interview", async ({ page }) => {
    await page.goto("/practice");
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill("Data Analyst at a retail company");

    // The tuning controls start folded behind the Customise disclosure.
    await page.getByRole("button", { name: /Customise session/ }).click();

    // The four config dropdowns are native <select>s whose <label> isn't
    // associated, so target each by a unique option it contains.
    const selectWith = (option: string) =>
      page.locator("select").filter({ has: page.locator("option", { hasText: option }) });

    await selectWith("Senior / experienced professional").selectOption("Senior / experienced professional");
    await selectWith("Technical interview").selectOption("Technical interview");
    await selectWith("Strict hiring-bar").selectOption("Strict hiring-bar");
    await selectWith("Confidence").selectOption("Confidence");

    await page.getByRole("button", { name: "Typed answers only" }).click();

    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes("/api/interview") && r.method() === "POST"),
      page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
    ]);

    const role = String(req.postDataJSON()?.role ?? "");
    expect(role, "interview type should reach the API").toContain("Technical interview");
    expect(role, "difficulty should reach the API").toContain("Strict hiring-bar");
    expect(role, "focus area should reach the API").toContain("Confidence");
    expect(role, "experience level should reach the API").toContain("Senior / experienced professional");
  });
});

/**
 * A paying candidate's controls.
 *
 * Renaming the paid tier to Pro switched off every gate that compared the plan
 * NAME to "Professional", which silently removed the question count, the
 * hybrid mix and custom questions from everyone paying for them (user report,
 * 16 September). Nothing in the pack noticed, so this spec watches the
 * controls themselves rather than the plan string.
 */
test.describe("paid candidate setup controls", () => {
  test.use({ storageState: statePath("professional") });

  test("question count and custom questions are available on Pro", async ({ page }) => {
    await page.goto("/practice");
    await page.getByRole("button", { name: /Customise session/ }).click();

    await expect(page.getByText("Number of questions")).toBeVisible();
    await expect(page.getByText("Custom question mix")).toBeVisible();
  });

  test("choosing a one-way video interview reveals its recording settings", async ({ page }) => {
    await page.goto("/practice");

    // The format is locked until the plan is known, so wait for the card to
    // stop showing the Pro badge rather than racing the usage request.
    const videoCard = page.getByRole("button", { name: /One-way video interview/ });
    // Locked until the plan resolves, and the locked card shows a "Pro" badge.
    await expect(videoCard).not.toContainText("Pro");
    await videoCard.click();

    // The settings live behind a toggle: the defaults are what employers set,
    // so they stay out of the way of starting an interview.
    await page.getByRole("button", { name: "Recording settings" }).click();

    const settings = page.getByTestId("video-interview-settings");
    await expect(settings).toBeVisible();
    // Defaults are the realistic ones: a minute to think, two to answer, one take.
    await expect(settings.getByRole("button", { name: "60 seconds" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(settings.getByRole("button", { name: "2 minutes" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(
      settings.getByRole("button", { name: "None, like the real thing" })
    ).toHaveAttribute("aria-pressed", "true");

    // The format implies voice and camera, so the answer mode follows it.
    await expect(
      page.getByRole("button", { name: /Voice \+ camera interview/ })
    ).toHaveAttribute("aria-pressed", "true");
  });
});
