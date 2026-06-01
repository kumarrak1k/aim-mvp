/**
 * Assessment centre — a candidate (the seeded AC assignment's candidate, = the
 * "free" persona) drives the full three-stage pipeline from the invite token:
 * case study (stage 1), interview → presentation brief (stage 2), and
 * presentation → final report (stage 3). Driven at the API level (not via the
 * browser's media capture), so it's deterministic under AIM_TEST_MODE=mock —
 * every stage routes its scoring/generation through callOpenAIChat → openaiMock.
 */
import { test, expect } from "@playwright/test";
import { statePath } from "../fixtures/env";
import { AC_INVITE_TOKEN } from "../fixtures/seedCompany";

test.describe("assessment centre", () => {
  test.use({ storageState: statePath("free") });

  test("candidate starts the AC and submits the case study for scoring", { tag: "@real-ai" }, async ({ page }) => {
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

  test("completes the interview and presentation stages through to a final report", { tag: "@real-ai" }, async ({ page }) => {
    // Same session as stage 1 — start-ac is idempotent on the assignment token.
    const { sessionId } = await (await page.request.post(`/api/assessment/${AC_INVITE_TOKEN}/start-ac`)).json();

    // Stage 2 — submit the interview aggregate. With stage 3 selected, the route
    // generates a presentation brief and advances the session to stage 3.
    const interviewRes = await page.request.post(`/api/assessment-centre/${sessionId}/submit-interview`, {
      data: {
        results: [
          {
            question: "Tell me about a time you led a team.",
            answer: "I led a cross-functional team to ship a release two weeks early by re-sequencing the plan.",
          },
        ],
        summary: { overall_score: 8 },
      },
    });
    expect(interviewRes.status(), await interviewRes.text()).toBe(200);
    const interviewBody = await interviewRes.json();
    expect(interviewBody.nextStage).toBe("stage3");
    expect(interviewBody.brief).toBeTruthy();

    // Stage 3 — submit the presentation transcript. The route scores it and
    // synthesises the final assessment-centre report.
    const presentationRes = await page.request.post(`/api/assessment-centre/${sessionId}/submit-presentation`, {
      data: {
        transcript:
          "My recommendation is to launch the own-brand line in two priority categories first. The data shows higher margin and growing demand; the main risk is incumbent retaliation, which we mitigate with an introductory price and a clear differentiator. In summary, a phased launch captures the upside while limiting the downside.",
      },
    });
    expect(presentationRes.status(), await presentationRes.text()).toBe(200);
    const presentationBody = await presentationRes.json();
    expect(presentationBody.report).toBeTruthy();
    expect(typeof presentationBody.report.overallScore).toBe("number");
  });
});
