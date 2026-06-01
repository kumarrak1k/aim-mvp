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
  test.use({ storageState: statePath("free") });

  test("the selected interview config is sent to /api/interview", async ({ page }) => {
    await page.goto("/practice");
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill("Data Analyst at a retail company");

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
