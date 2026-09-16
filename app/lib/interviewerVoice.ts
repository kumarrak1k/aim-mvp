/**
 * Who reads the interview question aloud.
 *
 * OpenAI's voices all have an American base, so a British interviewer has to be
 * asked for in a paragraph of instructions, and the model complies most of the
 * time. The part where it slips is what an ear catches, and it is why every
 * OpenAI voice was rejected. Alice and Dave are natively British: no accent
 * coaxing, no instructions, nothing to slip out of.
 *
 * OpenAI stays as the fallback so a missing key or a provider outage costs a
 * change of voice rather than silence.
 */

export type VoiceProvider = "elevenlabs" | "openai" | "none";

/**
 * Half the credits of the multilingual model, and faster. Questions are one or
 * two sentences, which is where the quality gap between the two is smallest.
 */
export const ELEVENLABS_MODEL = "eleven_flash_v2_5";

/** Chosen by ear by Rakesh, 16 September 2026, against the whole library. */
const ELEVENLABS_VOICES: Record<string, string> = {
  female: "Xb7hH8MSUJpSbSDYk0k2", // Alice
  male: "CYw3kZ02Hs0563khs1Fj", // Dave
};

export function elevenLabsVoiceId(preference: string): string {
  return ELEVENLABS_VOICES[preference] ?? ELEVENLABS_VOICES.female;
}

/**
 * Settings tuned for a question rather than an audiobook: enough stability to
 * stay in character across a session, enough style to sound interested.
 */
export const ELEVENLABS_VOICE_SETTINGS = {
  stability: 0.4,
  similarity_boost: 0.75,
  style: 0.25,
  use_speaker_boost: true,
} as const;

export function resolveVoiceProvider(options: {
  elevenLabsKey: string | undefined;
  openAiKey: string | undefined;
  /** AI_TTS_PROVIDER, for switching back without removing a key. */
  forced?: string;
}): VoiceProvider {
  const openAiAvailable = Boolean(options.openAiKey);
  const elevenAvailable = Boolean(options.elevenLabsKey);

  if (options.forced === "openai") return openAiAvailable ? "openai" : "none";
  if (options.forced === "elevenlabs") return elevenAvailable ? "elevenlabs" : "none";

  if (elevenAvailable) return "elevenlabs";
  if (openAiAvailable) return "openai";
  return "none";
}

/**
 * Pace is applied by the browser, not baked into the recording.
 *
 * One recording per question per voice can then be cached and replayed, rather
 * than three, which is what makes the banked questions almost free. The
 * candidate's choice still changes what they hear.
 */
export function playbackRateForPace(pace: string): number {
  if (pace === "slow") return 0.92;
  if (pace === "energetic") return 1.12;
  return 1;
}
