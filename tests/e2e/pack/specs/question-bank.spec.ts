/**
 * A real session asks banked questions.
 *
 * The unit tests prove the bank's rules; this proves the wiring — that a
 * candidate starting a normal practice session is actually asked one of the
 * questions employers use, and that the model was not involved in writing it.
 */
import { test, expect } from "@playwright/test";
import { statePath } from "../fixtures/env";
import { questionsFor } from "../../../../app/lib/questionBank";

test.describe("question bank", () => {
  test.use({ storageState: statePath("professional") });

  test("the first question of a session comes from the bank", async ({ page }) => {
    await page.goto("/practice");
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill("Graduate analyst");
    await page.getByRole("button", { name: "Typed answers only" }).click();

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/interview") && r.request().method() === "POST"),
      page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
    ]);

    const body = await response.json();
    expect(body.source, "the opener should not need the model").toBe("bank");
    expect(questionsFor({ type: "opener" }).map((q) => q.text)).toContain(body.question);

    // And it is the question actually put to the candidate.
    await expect(page.getByTestId("question-text")).toHaveText(body.question, { timeout: 30_000 });
  });
});
