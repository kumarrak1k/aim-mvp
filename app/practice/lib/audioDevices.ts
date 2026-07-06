/**
 * Persisted audio device preferences for interview practice.
 *
 * An empty value means "System default" — we pass no deviceId constraint and
 * never call setSinkId, so the browser follows the OS default device. Device
 * IDs are origin-scoped and stable per browser profile, which makes
 * localStorage the right home for the preference.
 *
 * Caveats handled here:
 * - Web Speech API (live transcription) has no device selection; only the
 *   getUserMedia analysis/recording stream honours the microphone choice.
 * - setSinkId is unsupported in some browsers (notably Safari); we feature
 *   detect and silently fall back to the system default output.
 */

const AUDIO_INPUT_KEY = "aim_audio_input_device";
const AUDIO_OUTPUT_KEY = "aim_audio_output_device";

function read(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function write(key: string, value: string): void {
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable (private mode) — selection lasts for this page only.
  }
}

export const getStoredAudioInput = () => read(AUDIO_INPUT_KEY);
export const setStoredAudioInput = (id: string) => write(AUDIO_INPUT_KEY, id);
export const getStoredAudioOutput = () => read(AUDIO_OUTPUT_KEY);
export const setStoredAudioOutput = (id: string) => write(AUDIO_OUTPUT_KEY, id);

// ── Media permission memory ─────────────────────────────────────────────────
// Zoom-style behaviour: the first session asks for camera/mic via the browser
// prompt; once granted we remember it so tablets skip the manual "tap to
// start camera" step on every later session. The browser itself persists the
// underlying permission per origin — this flag only tells our UI it can
// auto-start without waiting for a gesture.

const MEDIA_GRANTED_KEY = "aim_media_granted";

export const wasMediaGranted = () => read(MEDIA_GRANTED_KEY) === "1";
export const markMediaGranted = () => write(MEDIA_GRANTED_KEY, "1");
export const clearMediaGranted = () => write(MEDIA_GRANTED_KEY, "");

/** True when the browser's Permissions API reports camera access granted. */
export async function queryCameraGranted(): Promise<boolean> {
  try {
    if (!navigator.permissions?.query) return false;
    const status = await navigator.permissions.query({
      name: "camera" as PermissionName,
    });
    return status.state === "granted";
  } catch {
    // Permissions API missing or "camera" unsupported (Firefox/Safari).
    return false;
  }
}

export function outputSelectionSupported(): boolean {
  return (
    typeof HTMLMediaElement !== "undefined" &&
    "setSinkId" in HTMLMediaElement.prototype
  );
}

/**
 * Route an audio element to the user's chosen output device. No-op for the
 * system default or when the browser doesn't support output selection. A
 * failed call (device unplugged since selection) silently reverts to the
 * default device rather than blocking playback.
 */
export function applyPreferredSink(audio: HTMLAudioElement): void {
  const sinkId = getStoredAudioOutput();
  if (!sinkId) return;
  const el = audio as HTMLAudioElement & {
    setSinkId?: (id: string) => Promise<void>;
  };
  if (typeof el.setSinkId === "function") {
    el.setSinkId(sinkId).catch(() => {
      // Device gone — clear the stale preference so future audio is default.
      setStoredAudioOutput("");
    });
  }
}
