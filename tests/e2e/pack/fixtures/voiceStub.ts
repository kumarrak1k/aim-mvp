import type { Page } from "@playwright/test";

/**
 * Make voice / voice+camera mode hardware-free and deterministic before the page
 * loads:
 *  - Remove SpeechRecognition so the recogniser never runs (the editable answer
 *    transcript textarea is then driven purely by typing, with no interference).
 *  - Give speechSynthesis an instant no-op so the question's auto-speak can't
 *    hang the auto-listen choreography.
 *
 * This intentionally does NOT simulate real speech-to-text (that's browser
 * hardware) — it lets the voice-mode *pipeline* (mode select → question →
 * answer → feedback → summary) run end to end. Call BEFORE page.goto.
 */
export async function stubBrowserSpeech(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    try { w.SpeechRecognition = undefined; } catch { /* ignore */ }
    try { w.webkitSpeechRecognition = undefined; } catch { /* ignore */ }
    try {
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: {
          speak: (u: { onend?: () => void }) => {
            if (u && typeof u.onend === "function") setTimeout(() => u.onend!(), 0);
          },
          cancel: () => {},
          getVoices: () => [],
          onvoiceschanged: null,
          pending: false,
          speaking: false,
          paused: false,
        },
      });
    } catch { /* real speechSynthesis is harmless once SpeechRecognition is gone */ }
  });
}
