/**
 * Assessment-centre stage 1 — a candidate (the seeded AC assignment's candidate,
 * = the "free" persona) starts the assessment centre from the invite token and
 * submits the case study, asserting scored feedback comes back. Stages 2/3
 * (voice / presentation) are out of scope. Deterministic under AIM_TEST_MODE=mock
 * (the start-ac scenario and the case-study scoring both route through
 * callOpenAIChat → openaiMock).
 */
import { test, expect } from "@playwright/test";
import { statePath } from "../fixtures/env";
import { AC_INVITE_TOKEN } from "../fixtures/seedCompany";

test.describe("assessment centre — stage 1", () => {
  test.use({ storageState: statePath("free") });

  test("candidate starts the AC and submits the case study for scoring", async ({ page }) => {
    // Start the assessment centre from the invite token (generates the scenario).
    const startRes = await page.request.post(`/api/assessment/${AC_INVITE_TOKEN}/start-ac`);
    expect(startRes.status(), await startRes.text()).toBe(200);
    const { sessionId, initialStage } = await startRes.json();
    expect(sessionId).toBeTruthy();
    expect(initialStage).toBe(1);

    // Idempotency: starting again returns the SAME session.
    const startAgain = await (await page.request.post(`/api/assessment/${AC_INVITE_TOKEN}/start-ac`)).json();
    expect(startAgain.sessionId).toBe(sessionId);

    // Submit a case-study response → scored feedback (stage advances).
    const submitRes = await page.request.post(`/api/assessment-centre/${sessionId}/submit-case-study`, {
      data: {
        response:
          "Recommendation: prioritise the e-commerce build-out. The exhibits show online growing 18% YoY at a higher NPS (41 vs 24) while stores decline 6%; reallocating capital to fulfilment and customer experience should recover EBITDA within two years. Key risk: cannibalising store footfall — mitigate with a click-and-collect bridge that drives store visits.",
        timeMs: 60_000,
      },
    });
    expect(submitRes.status(), await submitRes.text()).toBe(200);
    const body = await submitRes.json();
    expect(body.feedback).toBeTruthy();
    expect(typeof body.feedback.overall).toBe("number");
  });
});
