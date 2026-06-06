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

const DIR = "marketing/screenshots";

/** Dismiss the cookie banner + hide dev-only overlays, then let things settle. */
async function clean(page: Page) {
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 1500 }).catch(() => {});
  await page
    .addStyleTag({
      content: `
        button[aria-label="Open Next.js Dev Tools"],
        nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }
      `,
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
