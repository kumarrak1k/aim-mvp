/**
 * The one-way video interview runtime.
 *
 * What matters here is the choreography the candidate cannot control: the
 * preparation countdown, recording starting on its own, the answer clock, and
 * the answer being taken when the candidate finishes. Real speech-to-text is
 * browser hardware and is stubbed out, as in the voice specs, so this proves
 * the format rather than the transcription.
 */
import { test, expect } from "@playwright/test";
import { statePath } from "../fixtures/env";
import { stubBrowserSpeech } from "../fixtures/voiceStub";
import { answerFor } from "../fixtures/answerBank";

test.describe("one-way video interview", () => {
  test.use({
    storageState: statePath("professional"),
    permissions: ["microphone", "camera"],
  });

  test("prepares, records to a clock, and takes the answer", async ({ page }) => {
    await stubBrowserSpeech(page);
    await page.goto("/practice");
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill("Graduate analyst");

    const videoCard = page.getByRole("button", { name: /One-way video interview/ });
    await expect(videoCard).toContainText("Recorded");
    await videoCard.click();

    // The shortest settings on offer, so the spec is not a stopwatch.
    const settings = page.getByTestId("video-interview-settings");
    await settings.getByRole("button", { name: "30 seconds" }).click();
    await settings.getByRole("button", { name: "1 minute" }).click();

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/interview") && r.ok()).catch(() => null),
      page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
    ]);

    const stage = page.getByTestId("one-way-video-stage");
    await expect(stage).toBeVisible({ timeout: 30_000 });

    // Preparation: the clock is running and nothing is being recorded.
    await expect(stage.getByText("Time to prepare")).toBeVisible();
    await expect(stage.getByText("Recording", { exact: true })).toHaveCount(0);
    const clock = page.getByTestId("video-clock");
    await expect(clock).toHaveText(/0:(2[0-9]|30)/);

    /**
     * REGRESSION (16 Sep, reported live): the camera opened but the stage
     * rendered a moment later, so the stream was never attached to the <video>
     * and the candidate watched a black box through the whole interview. The
     * element must be carrying the live stream and painting real frames.
     */
    // Poll until the element is BOTH carrying the stream and decoding frames.
    // Asserting the width separately raced the first frame and failed on a
    // working camera.
    await expect
      .poll(
        async () =>
          stage.locator("video").evaluate((el: HTMLVideoElement) => ({
            hasStream: el.srcObject !== null,
            painting: el.videoWidth > 0,
          })),
        { timeout: 20_000, message: "the camera preview never attached" }
      )
      .toEqual({ hasStream: true, painting: true });

    // There is no transcript on screen: that is the point of the format.
    await expect(page.getByPlaceholder(/Type your answer here|transcript will appear/i)).toHaveCount(0);

    await stage.getByRole("button", { name: /I'm ready/ }).click();

    // Recording, on the answer clock, counting down from a minute.
    await expect(stage.getByText("Recording", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(stage.getByText("Time left")).toBeVisible();
    await expect(clock).toHaveText(/0:(5[0-9]|4[0-9])|1:00/);

    await stage.getByRole("button", { name: "Finish this answer" }).click();

    await expect(stage.getByText("Answer recorded")).toBeVisible({ timeout: 30_000 });
  });
});

/**
 * Switching format mid-interview.
 *
 * The two formats suit different moods, so a candidate can move between them
 * without losing what they have already answered. The switch lands at the next
 * question, never in the middle of one.
 */
test.describe("switching format mid-interview", () => {
  test.use({
    storageState: statePath("plus"),
    permissions: ["microphone", "camera"],
  });

  test("a coaching session becomes a recorded one at the next question", async ({ page }) => {
    await stubBrowserSpeech(page);
    await page.goto("/practice");
    await page.getByPlaceholder(/Example:|saved profile context/i).first().fill("Graduate analyst");
    await page.getByRole("button", { name: "Voice + camera interview" }).click();

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/interview") && r.ok()).catch(() => null),
      page.getByRole("button", { name: /Start Tailored .*Interview/ }).click(),
    ]);

    const textarea = page.getByPlaceholder(/Type your answer here|transcript will appear/i);
    await expect(textarea).toBeVisible({ timeout: 30_000 });
    await textarea.fill(answerFor(""));

    // Asked during question one, and question one carries on as it was.
    await page.getByTestId("switch-to-video").click();
    await expect(page.getByTestId("switch-to-video")).toHaveText(/from the next question/);
    await expect(textarea).toBeVisible();

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/feedback")),
      page.getByRole("button", { name: "Get AI feedback" }).click(),
    ]);
    await expect(page.getByTestId("overall-score").first()).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: /Next question|Finish interview/ }).first().click();

    await expect(page.getByTestId("one-way-video-stage")).toBeVisible({ timeout: 30_000 });
  });
});
