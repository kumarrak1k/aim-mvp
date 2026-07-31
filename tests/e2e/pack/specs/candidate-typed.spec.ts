/**
 * The headline spec — a simulated candidate completes a FULL typed interview
 * end to end (start → N questions with real STAR answers → AI feedback each →
 * summary), asserting the feedback contract at every step. Deterministic and
 * ~free under AIM_TEST_MODE=mock.
 */
import { test, expect, type Page } from "@playwright/test";
import { statePath } from "../fixtures/env";
import { runTypedInterview } from "../fixtures/candidateBot";

/**
 * Watch the save call for the duration of an interview.
 *
 * Reaching the summary screen does NOT prove the session was persisted — the
 * POST to /api/practice-sessions happens behind that screen and its failure is
 * surfaced only in a banner. A regression there is invisible to the UI
 * assertions and silently loses completed candidate work, so assert it here.
 */
function watchSave(page: Page) {
  const statuses: number[] = [];
  page.on("response", (res) => {
    const url = new URL(res.url());
    if (
      url.pathname.endsWith("/api/practice-sessions") &&
      res.request().method() === "POST"
    ) {
      statuses.push(res.status());
    }
  });
  return {
    expectSaved() {
      expect(
        statuses,
        "the completed interview was never POSTed to /api/practice-sessions"
      ).not.toHaveLength(0);
      expect(statuses, `save returned ${statuses.join(", ")}`).toContain(200);
    },
  };
}

test.describe("typed interview — Free persona", () => {
  test.use({ storageState: statePath("free") });

  // @real-ai: this is the one interview the nightly real-AI run exercises (the
  // Professional path below is the same plumbing, so it stays mock-only).
  test("completes a full typed interview and reaches the summary", { tag: "@real-ai" }, async ({ page }) => {
    const save = watchSave(page);
    await runTypedInterview(page, { role: "Graduate software engineer", totalQuestions: 5 });
    save.expectSaved();
  });
});

test.describe("typed interview — Professional persona", () => {
  test.use({ storageState: statePath("professional") });

  test("completes a full typed interview and reaches the summary", async ({ page }) => {
    const save = watchSave(page);
    await runTypedInterview(page, { role: "Senior product manager", totalQuestions: 5 });
    save.expectSaved();
  });
});
