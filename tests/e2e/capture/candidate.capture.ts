/**
 * Marketing capture — candidate journey. NOT a test: it drives the real app as a
 * signed-in candidate and saves retina screenshots to marketing/screenshots/.
 * Run: npx dotenv-cli -e .env.test -- npx playwright test -c playwright.capture.config.ts candidate
 */
import { test, type Page } from "@playwright/test";
import { statePath } from "../pack/fixtures/env";
import { answerFor } from "../pack/fixtures/answerBank";
import { runTypedInterview } from "../pack/fixtures/candidateBot";
import { stubBrowserSpeech } from "../pack/fixtures/voiceStub";
import { HIDE_CHROME } from "./hideChrome";

const DIR = "marketing/screenshots";

/** Dismiss the cookie banner + hide dev-only overlays, then let things settle. */
async function clean(page: Page) {
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 1500 }).catch(() => {});
  await page
    .addStyleTag({
      content: HIDE_CHROME,
    })
    .catch(() => {});
  await page.waitForTimeout(500);
}

test.describe("marketing capture — candidate", () => {
  test.use({ storageState: statePath("professional") });

  // Hero shots: setup → live question → scored AI feedback.
  test("hero — setup, question, feedback", async ({ page }) => {
    await page.goto("/practice");
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill("Product Manager at a fintech scale-up");
    await clean(page);
    await page.screenshot({ path: `${DIR}/candidate-01-setup.png` });

    await page.getByRole("button", { name: "Typed answers only" }).click();
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/interview") && r.ok(), { timeout: 30_000 }).catch(() => null),
      page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
    ]);
    const textarea = page.getByPlaceholder(/Type your answer here|transcript will appear/i);
    await textarea.waitFor({ state: "visible", timeout: 30_000 });
    await clean(page);
    await page.screenshot({ path: `${DIR}/candidate-02-question.png` });

    const q = await page.getByTestId("question-text").innerText({ timeout: 5_000 }).catch(() => "");
    await textarea.fill(answerFor(q));
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/feedback"), { timeout: 30_000 }).catch(() => null),
      page.getByRole("button", { name: "Get AI feedback" }).click(),
    ]);
    await page.getByText("AI feedback is ready").waitFor({ timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(800);
    await clean(page);
    await page.screenshot({ path: `${DIR}/candidate-03-feedback.png` });
    await page.screenshot({ path: `${DIR}/candidate-03-feedback-full.png`, fullPage: true });
  });

  // The answer archive: the candidate's answer beside the model STAR answer.
  // This is the clearest proof the product has, because the two columns say
  // "here is what you said, here is what stronger looks like" without anyone
  // needing to read a word of it. Uses the seeded demo session, so no real
  // user's answer text ends up in marketing.
  test("candidate answer beside model answer", async ({ page }) => {
    await page.goto("/progress");
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);

    // Open the most recent session. "Open" is a button on the progress
    // dashboard, not a link, which is why matching on link found nothing.
    await page.getByRole("button", { name: "Open" }).first().click({ timeout: 15_000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);

    // Each question on the session page is a collapsed accordion with its own
    // "Open" button. The markup is present either way, so the panel is in the
    // DOM but not visible until this is clicked.
    await page.getByRole("button", { name: "Open" }).first().click({ timeout: 15_000 });
    await page.waitForTimeout(600);

    const star = page.getByText("Model answer (STAR)").first();
    await star.waitFor({ timeout: 20_000 });
    await star.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${DIR}/candidate-09-model-answer.png` });
    await page.screenshot({ path: `${DIR}/candidate-09-model-answer-full.png`, fullPage: true });
  });

  // The readiness trend, shot as an element rather than a viewport. The page
  // opens on a marketing hero, so a 1440x900 screenshot of /progress captures
  // a headline and misses the chart entirely, which is the one thing on that
  // page worth showing. Pair with DEMO_ARC=short for a three-session arc.
  test("readiness trend chart", async ({ page }) => {
    await page.goto("/progress");
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    const heading = page.getByText("Readiness trend", { exact: true });
    await heading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600); // let the chart's entry animation settle

    // Shoot the chart element itself. Filtering locators by text matches only
    // the header block, and clipping a union of the two proved fragile; the
    // chart's fixed 700x260 viewBox is a stable handle, and the bare chart
    // composes better into marketing artwork than the panel chrome around it.
    const chart = page.locator('svg[viewBox="0 0 700 260"]').first();
    await chart.waitFor({ state: "visible", timeout: 10_000 });

    // Clip slightly wider than the SVG. The "TARGET" label is drawn past the
    // viewBox edge, so an element screenshot cuts it mid-word, which reads as a
    // rendering fault in the finished artwork.
    // The chart's "TARGET" label is drawn past the viewBox edge, so this cuts
    // it mid-word. Widening the clip to include it fails: the element sits at
    // the right of a grid column and the extra width lands outside the
    // viewport, which page.screenshot rejects outright rather than trimming.
    // render-social.mjs shaves the partial label off instead.
    await chart.screenshot({ path: `${DIR}/candidate-08-trend.png` });
  });

  // The Studio opens the journey: it is where someone who has not been invited
  // to interview yet actually starts, so the marketing needs a shot of it.
  test("cv & application studio", async ({ page }) => {
    await page.goto("/career-docs");
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    await page.screenshot({ path: `${DIR}/candidate-07-studio.png` });
    await page.screenshot({ path: `${DIR}/candidate-07-studio-full.png`, fullPage: true });
  });

  // Completion shots: drive a full interview with the proven bot, then capture
  // the readiness summary and the progress dashboard.
  test("completion — summary + progress", async ({ page }) => {
    await runTypedInterview(page, { role: "Product Manager at a fintech scale-up", totalQuestions: 5 });
    await page.waitForTimeout(1500);
    await clean(page);
    await page.screenshot({ path: `${DIR}/candidate-04-summary.png` });
    await page.screenshot({ path: `${DIR}/candidate-04-summary-full.png`, fullPage: true });

    await page.goto("/progress");
    await page.waitForLoadState("networkidle").catch(() => {});
    await clean(page);
    await page.screenshot({ path: `${DIR}/candidate-05-progress.png` });
    await page.screenshot({ path: `${DIR}/candidate-05-progress-full.png`, fullPage: true });
  });
});

// The differentiator: voice + camera mode. Speech-to-text is stubbed and a
// synthetic camera device is used (so the delivery scores reflect a faceless
// test stream, not a real candidate) — best-effort; a real recording makes the
// strongest version of this shot.
test.describe("marketing capture — voice + camera", () => {
  test.use({ storageState: statePath("professional"), permissions: ["microphone", "camera"] });

  test("voice+camera interview + feedback", async ({ page }) => {
    await stubBrowserSpeech(page);
    await page.goto("/practice");
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill("Product Manager at a fintech scale-up");
    await clean(page);
    await page.getByRole("button", { name: "Voice + camera interview" }).click();
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/interview") && r.ok(), { timeout: 30_000 }).catch(() => null),
      page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
    ]);
    const textarea = page.getByPlaceholder(/Type your answer here|transcript will appear/i);
    await textarea.waitFor({ state: "visible", timeout: 30_000 });
    await clean(page);
    await page.screenshot({ path: `${DIR}/candidate-06-voice-camera-interview.png` });

    const q = await page.getByTestId("question-text").innerText({ timeout: 5_000 }).catch(() => "");
    await textarea.fill(answerFor(q));
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/feedback"), { timeout: 30_000 }).catch(() => null),
      page.getByRole("button", { name: "Get AI feedback" }).click(),
    ]);
    await page.getByText("AI feedback is ready").waitFor({ timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await clean(page);
    await page.screenshot({ path: `${DIR}/candidate-06-voice-camera.png` });
    await page.screenshot({ path: `${DIR}/candidate-06-voice-camera-full.png`, fullPage: true });
  });
});
