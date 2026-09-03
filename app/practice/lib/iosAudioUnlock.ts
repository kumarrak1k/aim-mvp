/**
 * iOS Safari requires HTMLAudioElement.play() to be called within a
 * synchronous user-gesture event chain. Once audio plays via a gesture, the
 * page's audio session is unlocked (iOS 15+) and later async play() calls —
 * including auto-play on question advance — are permitted for the page session.
 *
 * Call unlockAudioOutput() at the VERY START of any gesture handler that will
 * (now or later) play audio: Start interview, Play question, submit / next.
 * It reuses one silent element and simply re-attempts on every call — cheap and
 * idempotent. It must NOT short-circuit after the first call: the first call
 * often happens OUTSIDE a gesture (from an effect), where the unlock silently
 * fails, and a later real gesture must still be allowed to do the real unlock.
 */

let silentEl: HTMLAudioElement | null = null;

export function unlockAudioOutput(): void {
  try {
    if (!silentEl) {
      // Minimal valid silent WAV (44 bytes), base64-encoded.
      silentEl = new Audio(
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
      );
      silentEl.volume = 0;
    }
    // Rewind so a repeat call always has something to play.
    try {
      silentEl.currentTime = 0;
    } catch {
      // Ignore — seeking before metadata can throw on some browsers.
    }
    void silentEl.play().catch(() => {
      // Outside a gesture (or non-iOS) this rejects; a later gesture call
      // will succeed and perform the real unlock.
    });
  } catch {
    // Non-iOS browsers don't need this; ignore any errors.
  }
}
