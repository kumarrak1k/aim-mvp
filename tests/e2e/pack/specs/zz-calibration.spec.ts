/**
 * THROWAWAY calibration run (not part of the normal pack — delete after use).
 * Drives a real signed-in typed interview and submits a graded ladder of
 * answers, capturing what the REAL /api/feedback and /api/summary return.
 *
 * Run with real AI:
 *   npx dotenv-cli -e .env.test -- cross-env AIM_TEST_MODE=real \
 *     npx playwright test -c playwright.tests.config.ts zz-calibration
 */
import { test, expect } from "@playwright/test";
import { statePath } from "../fixtures/env";
import { answerFor } from "../fixtures/answerBank";

/** Ladder: worst → best. One per question in a 5-question session. */
const LADDER = [
  {
    tier: "1 weak",
    text: "I've worked on lots of things like this and I usually cope well. I'm a hard worker and I get things done. I think I handle it better than most people.",
  },
  {
    tier: "2 AI-generic",
    text: "In a previous role I was responsible for handling this kind of situation. I began by clearly defining the scope and priorities, then established a communication cadence with stakeholders to ensure alignment. I identified the key risks early and put mitigation plans in place, delegating effectively to leverage the strengths of my team. Throughout I maintained a calm and solution-focused mindset, which helped the team stay motivated. As a result we delivered on time and to a high standard, and the stakeholders were very satisfied. This reinforced the importance of proactive planning, clear communication and adaptability.",
  },
  {
    tier: "3 real story, no STAR",
    text: "The one that stands out is a warehouse system migration. We were eight weeks from a contractual deadline when our integration partner pulled two developers, and the stock-reconciliation module was still untested. I descoped the reporting dashboards to phase two so we could protect core inventory functions, which the finance team disliked, so I agreed a manual interim report with their head of reporting for the first month. I moved us to daily fifteen-minute stand-ups with the partner and got their account director on a weekly call. We went live two days before the deadline with no stock discrepancies over 0.5%, and phase two landed six weeks later. My lesson was that I left the formal escalation too long.",
  },
  {
    tier: "4 same + STAR labels",
    text: "Situation: I was operations manager for a 40-person distribution centre migrating to a new warehouse management system with a hard contractual deadline. Task: I owned delivery, and eight weeks out our integration partner cut two developers, leaving stock reconciliation untested. Action: I descoped reporting dashboards to phase two to protect core inventory functions, agreed a manual interim report with the finance lead, introduced daily fifteen-minute stand-ups with the partner and escalated the resourcing gap to their account director. Result: we went live two days early with stock discrepancies under 0.5%, and phase two landed six weeks later. My lesson was to formalise supplier escalation sooner.",
  },
  {
    tier: "5 STAR + metrics + reflection",
    text: "Situation: I was operations manager for a 40-person distribution centre migrating to a new warehouse management system, with a hard deadline of 1 October and a £120k penalty clause. Task: I owned end-to-end delivery, and eight weeks out our integration partner cut two of their four developers, leaving the stock-reconciliation module untested. Action: I descoped the reporting dashboards to phase two to protect core inventory functions, negotiated a manual interim report with the finance lead so they weren't blocked, introduced daily fifteen-minute stand-ups with the partner, formally escalated the resourcing gap to their account director within 48 hours, and reassigned two of my own analysts to regression testing. Result: we went live two days early, stock discrepancies stayed under 0.5% against a 2% tolerance, we avoided the £120k penalty, and phase two shipped six weeks later. Reflection: my main learning was to formalise supplier escalation immediately rather than absorbing the risk myself.",
  },
];

test.describe("@calibration scoring calibration", () => {
  test.use({ storageState: statePath("professional") });

  test("graded answers through the real scorer", async ({ page }) => {
    test.setTimeout(600_000);

    const feedback: Array<Record<string, unknown>> = [];
    let summary: Record<string, unknown> | null = null;

    page.on("response", async (res) => {
      try {
        if (res.url().includes("/api/feedback") && res.ok()) {
          const j = await res.json();
          feedback.push({ overall: j.overall_score, cats: j.category_scores });
        }
        if (res.url().includes("/api/summary") && res.ok()) {
          const j = await res.json();
          summary = { overall: j.overall_score, readiness: j.readiness_score, signal: j.hire_signal };
        }
      } catch {
        /* ignore non-JSON */
      }
    });

    // ── Start a typed session ────────────────────────────────────────────────
    await page.goto("/practice");
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill("Operations Manager");

    const typed = page.getByRole("button", { name: "Typed answers only" });
    await expect(async () => {
      await typed.click();
      await expect(typed).toHaveAttribute("aria-pressed", "true", { timeout: 1_000 });
    }).toPass({ timeout: 20_000 });

    await page.getByRole("button", { name: /Start Tailored .*Interview/ }).click();

    // ── One ladder rung per question ─────────────────────────────────────────
    const questions: string[] = [];
    for (let i = 0; i < 5; i++) {
      const textarea = page.getByPlaceholder(/Type your answer here|transcript will appear/i);
      await expect(textarea).toBeVisible({ timeout: 60_000 });

      // Wait for the real question — reading too early captured the
      // "Generating your question..." placeholder on the previous run.
      let qText = "";
      await expect
        .poll(
          async () => {
            qText = await page
              .getByTestId("question-text")
              .innerText({ timeout: 5_000 })
              .catch(() => "");
            return qText && !/generating/i.test(qText);
          },
          { timeout: 90_000 }
        )
        .toBeTruthy();
      questions.push(qText);

      // INTENT-MATCHED strong answer. The previous run fed one warehouse story
      // to five different questions, so relevance (correctly) collapsed and the
      // ladder inverted — that measured question-matching, not answer quality.
      await textarea.fill(answerFor(qText));
      await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/feedback"), { timeout: 120_000 }),
        page.getByRole("button", { name: "Get AI feedback" }).click(),
      ]);
      await expect(page.getByTestId("overall-score").first()).toBeVisible({ timeout: 60_000 });
      await page.getByRole("button", { name: /Next question|Finish interview/ }).first().click();
    }

    await page.waitForResponse((r) => r.url().includes("/api/summary"), { timeout: 180_000 }).catch(() => null);
    await page.waitForTimeout(4000);

    console.log("\n===== CALIBRATION: strong intent-matched answers (real API) =====");
    questions.forEach((q, i) => {
      const f = feedback[i] as { overall?: number; cats?: Record<string, number> } | undefined;
      const c = f?.cats ?? {};
      console.log(
        `Q${i + 1} overall ${String(f?.overall ?? "-").padStart(3)}  ` +
          `[content ${c.content ?? "-"} clarity ${c.clarity ?? "-"} relevance ${c.relevance ?? "-"} structure ${c.structure ?? "-"} confidence ${c.confidence ?? "-"}]  ` +
          `${q.slice(0, 70)}`
      );
    });
    console.log("SESSION SUMMARY:", JSON.stringify(summary));
    console.log("===========================================================\n");

    expect(feedback.length, "expected a score for every question").toBe(5);
  });
});
