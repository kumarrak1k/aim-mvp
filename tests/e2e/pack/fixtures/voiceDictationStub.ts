import type { Page } from "@playwright/test";

/**
 * Speech stub that actually dictates, for marketing footage.
 *
 * voiceStub.ts deliberately REMOVES SpeechRecognition so the test pack can
 * drive the transcript by typing. That is right for tests and wrong for
 * filming: the advert needs to show the transcript filling in as someone
 * speaks, which is a real feature, and typing into the box would be showing
 * something the product does not do.
 *
 * So this installs a recogniser that emits genuine interim results word by
 * word and then a final result, exactly as the browser API does. The app's own
 * useBrowserSpeech hook handles them unchanged, which means what gets recorded
 * is the real code path rather than a mock of it.
 *
 * Call BEFORE page.goto.
 */
export async function stubDictation(
  page: Page,
  phrase: string,
  opts: { wordMs?: number; speakMs?: number } = {}
): Promise<void> {
  const wordMs = opts.wordMs ?? 260; // ~230 wpm, an unhurried speaking pace
  const speakMs = opts.speakMs ?? 2600; // how long the question appears to be read aloud

  await page.addInitScript(
    ({ phrase, wordMs, speakMs }) => {
      const words = phrase.split(/\s+/).filter(Boolean);

      class FakeRecognition {
        continuous = false;
        interimResults = false;
        lang = "en-GB";
        onstart: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: ((e: unknown) => void) | null = null;
        onresult: ((e: unknown) => void) | null = null;
        private timers: number[] = [];
        private stopped = false;

        start() {
          this.stopped = false;
          this.onstart?.();
          // Interim results accumulate, then one final: the same shape the
          // browser emits, so the hook's isFinal branch is exercised too.
          words.forEach((_, i) => {
            const t = window.setTimeout(() => {
              if (this.stopped) return;
              const text = words.slice(0, i + 1).join(" ");
              const isFinal = i === words.length - 1;
              this.onresult?.({
                resultIndex: 0,
                results: Object.assign([{ 0: { transcript: text }, isFinal, length: 1 }], {
                  length: 1,
                }),
              });
              if (isFinal) {
                const e = window.setTimeout(() => !this.stopped && this.onend?.(), 300);
                this.timers.push(e);
              }
            }, (i + 1) * wordMs);
            this.timers.push(t);
          });
        }

        stop() {
          this.stopped = true;
          this.timers.forEach((t) => window.clearTimeout(t));
          this.timers = [];
          this.onend?.();
        }

        abort() {
          this.stop();
        }
      }

      const w = window as unknown as Record<string, unknown>;
      w.SpeechRecognition = FakeRecognition;
      w.webkitSpeechRecognition = FakeRecognition;

      // Speech synthesis that takes realistic time rather than returning
      // instantly, so the "question is read to you" beat is visible on camera.
      try {
        Object.defineProperty(window, "speechSynthesis", {
          configurable: true,
          value: {
            speak: (u: { onstart?: () => void; onend?: () => void }) => {
              u?.onstart?.();
              window.setTimeout(() => u?.onend?.(), speakMs);
            },
            cancel: () => {},
            getVoices: () => [],
            onvoiceschanged: null,
            pending: false,
            speaking: false,
            paused: false,
          },
        });
      } catch {
        /* real speechSynthesis is harmless here */
      }
    },
    { phrase, wordMs, speakMs }
  );
}
