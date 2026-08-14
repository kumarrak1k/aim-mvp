/**
 * Marketing CLIPS for the advert — the beats that only exist in motion.
 *
 * A screenshot cannot show a question being read aloud, a transcript filling in
 * as someone speaks, or a score landing. Those are the beats the advert needs
 * most, so they are recorded from the real app rather than mocked up.
 *
 * The dictation stub drives the app's own speech pipeline, so what ends up on
 * camera is the real transcript behaviour, not a text box being typed into.
 *
 * Run:
 *   npx dotenv-cli -e .env.test -- npx playwright test -c playwright.capture.config.ts advert
 * Output: test-results/**\/video.webm, copied to marketing/clips/ afterwards.
 */
import { test, type Page } from "@playwright/test";
import { statePath } from "../pack/fixtures/env";
import { stubDictation } from "../pack/fixtures/voiceDictationStub";
import { HIDE_CHROME } from "./hideChrome";

const VIDEO = { mode: "on" as const, size: { width: 1440, height: 900 } };
test.use({ video: VIDEO });

const ANSWER =
  "In my final year project our weekly reports took two days to produce, " +
  "and the delay was holding up decisions. I redesigned the data pipeline " +
  "and automated the validation checks. Turnaround fell by forty per cent " +
  "and the team adopted the approach.";

async function clean(page: Page) {
  await page.getByRole("button", { name: "Got it" }).click({ timeout: 1500 }).catch(() => {});
  await page.addStyleTag({ content: HIDE_CHROME }).catch(() => {});
  await page.waitForTimeout(400);
}
const beat = (page: Page, ms = 1200) => page.waitForTimeout(ms);

test.describe("advert clips", () => {
  test.use({ storageState: statePath("professional"), permissions: ["microphone", "camera"] });

  test("voice answer, live transcript, scored feedback", async ({ page }) => {
    test.setTimeout(180_000);
    await stubDictation(page, ANSWER, { wordMs: 240, speakMs: 2800 });

    await page.goto("/practice");
    await clean(page);
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill("Product Manager at a fintech scale-up");
    await beat(page);

    // Voice mode: the question is spoken to you, then it listens.
    await page.getByRole("button", { name: /Voice interview|Voice \+ camera/ }).first().click();
    await beat(page, 800);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/interview") && r.ok(), { timeout: 30_000 }).catch(() => null),
      page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
    ]);

    // Hold on the question while it is read aloud. This is the beat that shows
    // the product talking to you rather than just displaying text.
    await page.getByTestId("question-text").waitFor({ timeout: 30_000 }).catch(() => {});
    await beat(page, 3200);

    // Then the transcript fills in, word by word, from the app's own handler.
    await beat(page, 7000);

    await page.getByRole("button", { name: "Get AI feedback" }).click().catch(() => {});
    await page.getByText("AI feedback is ready").waitFor({ timeout: 40_000 }).catch(() => {});
    await beat(page, 1500);

    // Scroll the STAR panel into shot and hold on it.
    await page.getByText("Stronger answer example", { exact: false }).scrollIntoViewIfNeeded().catch(() => {});
    await beat(page, 3000);
  });
});
