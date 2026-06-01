/**
 * The simulated candidate — drives a full TYPED interview end to end.
 *
 * Reads each question (best-effort), types a realistic STAR answer, submits,
 * waits on the /api/feedback network response, asserts the feedback contract,
 * advances, and finishes at the summary/progress screen. Selectors are verified
 * against PracticeStartScreen.tsx / AnswerWorkspace.tsx / QuestionHero.tsx.
 *
 * Designed for AIM_TEST_MODE=mock (deterministic, ~free), but works against real
 * AI too — it asserts the contract, not exact non-deterministic scores.
 */
import { expect, type Page } from "@playwright/test";
import { answerFor } from "./answerBank";

export async function runTypedInterview(
  page: Page,
  opts: { role: string; totalQuestions?: number },
): Promise<void> {
  const total = opts.totalQuestions ?? 5;

  // ── Start screen ───────────────────────────────────────────────────────────
  await page.goto("/practice");
  await page.getByPlaceholder(/Example:|saved profile context/i).first().fill(opts.role);
  // Typed is the default mode; clicking it is safe and explicit (it's the only
  // unlocked mode for the Free persona).
  await page.getByRole("button", { name: "Typed answers only" }).click();

  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/interview") && r.ok()).catch(() => null),
    page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
  ]);

  // ── Per-question loop ──────────────────────────────────────────────────────
  for (let i = 1; i <= total; i++) {
    const textarea = page.getByPlaceholder(/Type your answer here|transcript will appear/i);
    await expect(textarea).toBeVisible({ timeout: 30_000 });

    // Best-effort read of the question so the answer can match its intent;
    // falls back to a strong default if the text can't be located.
    let questionText = "";
    try {
      questionText = await page
        .locator("section p")
        .filter({ hasText: /\?\s*$/ })
        .first()
        .innerText({ timeout: 2_000 });
    } catch {
      questionText = "";
    }

    await textarea.fill(answerFor(questionText));

    const [feedbackResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/feedback")),
      page.getByRole("button", { name: "Get AI feedback" }).click(),
    ]);
    expect(feedbackResponse.ok(), "feedback API should return 2xx").toBeTruthy();

    // The "AI feedback is ready" banner confirms feedback rendered.
    await expect(page.getByText("AI feedback is ready")).toBeVisible({ timeout: 30_000 });

    // Advance — "Next question" until the last, then "Finish interview…".
    await page.getByRole("button", { name: /Next question|Finish interview/ }).first().click();
  }

  // ── Finish → summary / progress ────────────────────────────────────────────
  await page.waitForResponse((r) => r.url().includes("/api/summary")).catch(() => null);

  // Either the app navigates to the saved session, or it renders the summary
  // inline. Accept either as a successful completion.
  await expect
    .poll(
      async () => {
        if (/\/progress\//.test(page.url())) return true;
        const summaryVisible = await page
          .getByText(/readiness|hire signal|interview report|final assessment|session summary/i)
          .first()
          .isVisible()
          .catch(() => false);
        return summaryVisible;
      },
      { timeout: 30_000, message: "expected to reach the summary or /progress after finishing" },
    )
    .toBe(true);
}
