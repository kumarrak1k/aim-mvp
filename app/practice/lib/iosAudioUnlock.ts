/**
 * iOS Safari requires HTMLAudioElement.play() to be called within a
 * synchronous user-gesture event chain. Once ANY audio plays via a gesture,
 * the entire audio session is unlocked for the page load — all subsequent
 * play() calls (async, on different elements) are then permitted.
 *
 * Call unlockAudioOutput() at the VERY START of any gesture handler that
 * will later need to play audio (even asynchronously). The call is a no-op
 * after the first successful unlock and on non-iOS browsers.
 */

let unlocked = false;

export function unlockAudioOutput(): void {
  if (unlocked) return;
  unlocked = true;
  try {
    // Minimal valid silent WAV (44 bytes), base64-encoded.
    const sil = new Audio(
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
    );
    sil.volume = 0;
    void sil.play();
  } catch {
    // Non-iOS browsers don't need this; ignore any errors.
  }
}
