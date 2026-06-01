/**
 * Voice-mode interview pipeline (Plus persona — voice is unlocked). Drives the
 * full voice-mode session: select Voice mode → question → answer → AI feedback →
 * summary. The live speech-to-text is stubbed out (browser hardware), so this
 * proves the voice-mode UI integration, not the transcription itself. The voice
 * scoring route /api/voice-analysis is covered separately in ai-routes.spec.ts.
 */
import { test } from "@playwright/test";
import { statePath } from "../fixtures/env";
import { runTypedInterview } from "../fixtures/candidateBot";
import { stubBrowserSpeech } from "../fixtures/voiceStub";

test.describe("voice interview", () => {
  test.use({ storageState: statePath("plus"), permissions: ["microphone"] });

  test("completes a voice-mode interview end to end", async ({ page }) => {
    await stubBrowserSpeech(page); // hardware-free, deterministic voice path
    // 5 matches the session's question count (the bot answers every question
    // through to the Finish button → summary).
    await runTypedInterview(page, { role: "Customer Success Manager", totalQuestions: 5, mode: "voice" });
  });
});

test.describe("voice + camera interview", () => {
  test.use({ storageState: statePath("plus"), permissions: ["microphone", "camera"] });

  test("completes a voice+camera interview end to end", async ({ page }) => {
    // Synthetic camera stream comes from the chromium project's fake-device
    // launch args; the camera ML runs on it (no face → low scores, fine) and the
    // typed-answer pipeline completes. Real webcam capture is browser hardware.
    await stubBrowserSpeech(page);
    await runTypedInterview(page, { role: "Customer Success Manager", totalQuestions: 5, mode: "voice-camera" });
  });
});
