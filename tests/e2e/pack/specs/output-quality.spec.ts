/**
 * Real-AI OUTPUT QUALITY (not just shape). The mock returns a fixed score for
 * every answer, so a quality differential can only be asserted against the live
 * model — this spec therefore skips unless AIM_TEST_MODE=real and runs in the
 * nightly real-AI job. It proves the scorer actually discriminates: a strong,
 * specific STAR answer must out-score a vague, weak one for the same question.
 */
import { test, expect } from "@playwright/test";
import { statePath } from "../fixtures/env";

const REAL = process.env.AIM_TEST_MODE === "real";

test.describe("real-AI output quality", () => {
  test.skip(!REAL, "Runs only with AIM_TEST_MODE=real (npm run test:pack:real).");
  test.use({ storageState: statePath("free") });

  test("a strong interview answer scores higher than a weak one", { tag: "@real-ai" }, async ({ page }) => {
    const question = "Tell me about a time you led a project under pressure.";

    const score = async (answer: string): Promise<number> => {
      const res = await page.request.post("/api/feedback", {
        data: { question, answer, voiceAnalysis: null, videoAnalysis: null },
      });
      expect(res.status(), await res.text()).toBe(200);
      return (await res.json()).overall_score as number;
    };

    const strong = await score(
      "In my final year I led a five-person team to rebuild our client's reporting pipeline against a three-week deadline. I split the work into owned streams, ran daily ten-minute stand-ups, and personally rewrote the data-validation layer. We shipped two days early, cut report turnaround by 40%, and the client renewed their contract.",
    );
    const weak = await score(
      "Um, I think I did some teamwork once. It went okay I guess. I can't really remember the details but it was fine and we finished it.",
    );

    expect(strong, `strong=${strong} weak=${weak} — strong should beat weak`).toBeGreaterThan(weak);
    expect(strong).toBeGreaterThanOrEqual(6);
    expect(weak).toBeLessThanOrEqual(6);
  });
});
