/**
 * REGRESSION (19 Sep, reported live): the report showed a model answer for
 * question 1 and none for the rest.
 *
 * The model answer is fetched alongside the scores and arrives a few seconds
 * after them. The session copied each answer into the results the moment the
 * candidate moved on, so any model answer still in flight was never saved: a
 * one-way interview moves on as soon as the scores are in, a coaching interview
 * whenever someone clicks Next quickly, and the last question always, because
 * the report is written the instant it is answered.
 *
 * This slows the model answer down and moves on straight after the scores -
 * the worst case, and exactly what a one-way interview does - then checks the
 * report that is saved has a model answer for every question.
 */
import { test, expect, type Page } from "@playwright/test";
import { statePath } from "../fixtures/env";
import { answerFor } from "../fixtures/answerBank";

const MODEL_ANSWER_DELAY_MS = 4_000;

type SavedResult = { question: string; feedback?: { improved_answer?: string } };

/** Hold every model answer back, so the candidate always moves on first. */
async function delayModelAnswers(page: Page) {
  await page.route("**/api/feedback/model-answer", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, MODEL_ANSWER_DELAY_MS));
    await route.continue();
  });
}

/** The completed session's results, as POSTed to /api/practice-sessions. */
function captureSavedReport(page: Page) {
  let saved: SavedResult[] | null = null;
  page.on("request", (request) => {
    if (!request.url().includes("/api/practice-sessions") || request.method() !== "POST") return;
    const body = request.postDataJSON() as { summary?: unknown; results?: SavedResult[] } | null;
    if (body?.summary && body.results) saved = body.results;
  });
  return () => saved;
}

test.describe("model answers in the report", () => {
  test.use({ storageState: statePath("professional") });

  test("every question keeps its model answer when the candidate moves on before it arrives", async ({ page }) => {
    await delayModelAnswers(page);
    const savedReport = captureSavedReport(page);

    await page.goto("/practice");
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill("Graduate analyst");
    const typed = page.getByRole("button", { name: "Typed answers only" });
    await typed.click();
    await expect(typed).toHaveAttribute("aria-pressed", "true");

    // Three questions is enough to prove it: the middle one covers "moved on
    // mid-session", the last covers "report written straight away".
    const total = 3;
    await page.getByRole("button", { name: /Customise session/ }).click();
    const fewer = page.getByRole("button", { name: "−" }).first();
    await fewer.click();
    await fewer.click();
    await expect(page.getByRole("button", { name: /Start Tailored 3-Question Interview/ })).toBeVisible();

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/interview") && r.ok()).catch(() => null),
      page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
    ]);

    for (let i = 1; i <= total; i++) {
      const textarea = page.getByPlaceholder(/Type your answer here|transcript will appear/i);
      await expect(textarea).toBeVisible({ timeout: 30_000 });
      const questionText = await page.getByTestId("question-text").innerText().catch(() => "");
      await textarea.fill(answerFor(questionText));

      await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/feedback") && !r.url().includes("model-answer")),
        page.getByRole("button", { name: "Get AI feedback" }).click(),
      ]);
      await expect(page.getByTestId("overall-score").first()).toBeVisible({ timeout: 30_000 });

      // Straight on, with the model answer still being written.
      const onLast = i === total;
      await page
        .getByRole("button", { name: onLast ? /Finish interview/ : /Next question/ })
        .first()
        .click();
      if (onLast) break;
    }

    await expect
      .poll(() => savedReport()?.length ?? 0, {
        timeout: 60_000,
        message: "the finished interview was never saved",
      })
      .toBeGreaterThan(0);

    const results = savedReport()!;
    const missing = results
      .map((result, index) => (result.feedback?.improved_answer ? null : index + 1))
      .filter((n) => n !== null);
    expect(missing, `questions saved without a model answer: ${missing.join(", ")}`).toEqual([]);
  });
});
