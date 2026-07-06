/**
 * Central OpenAI model tiers. Swap a tier here and every route follows.
 *
 * Tiering (July 2026):
 *   QUALITY — the core candidate-facing coaching quality: feedback + model
 *             answers, question generation, session summaries.
 *   PREMIUM — Professional-plan features where output quality is the selling
 *             point: assessment centres and career documents.
 *   UTILITY — high-volume, latency-sensitive helpers: support chat,
 *             transcript cleaning, the free STAR scorer.
 *
 * Speech models (whisper-1, tts-1) are configured at their call sites and are
 * not part of this map.
 */

export const MODEL_QUALITY = "gpt-5.4-mini";
export const MODEL_PREMIUM = "gpt-5.2";
export const MODEL_UTILITY = "gpt-5.4-nano";

export type ReasoningEffort = "none" | "low" | "medium" | "high" | "xhigh";

/**
 * Default reasoning effort per tier. GPT-5.x models spend hidden reasoning
 * tokens before answering; "none" keeps latency chat-like for utility
 * routes, "low" gives the quality/premium tiers a little thinking room
 * without noticeable delay. Callers can override per request.
 * (GPT-5.4-era scale is none/low/medium/high/xhigh — "minimal" was removed.)
 */
export function defaultReasoningEffort(model: string): ReasoningEffort {
  if (model === MODEL_UTILITY) return "none";
  return "low";
}
