/**
 * The headline spec — a simulated candidate completes a FULL typed interview
 * end to end (start → N questions with real STAR answers → AI feedback each →
 * summary), asserting the feedback contract at every step. Deterministic and
 * ~free under AIM_TEST_MODE=mock.
 */
import { test } from "@playwright/test";
import { statePath } from "../fixtures/env";
import { runTypedInterview } from "../fixtures/candidateBot";

test.describe("typed interview — Free persona", () => {
  test.use({ storageState: statePath("free") });

  test("completes a full typed interview and reaches the summary", async ({ page }) => {
    await runTypedInterview(page, { role: "Graduate software engineer", totalQuestions: 5 });
  });
});

test.describe("typed interview — Professional persona", () => {
  test.use({ storageState: statePath("professional") });

  test("completes a full typed interview and reaches the summary", async ({ page }) => {
    await runTypedInterview(page, { role: "Senior product manager", totalQuestions: 5 });
  });
});
