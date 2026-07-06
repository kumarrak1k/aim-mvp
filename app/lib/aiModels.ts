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

/**
 * COST ROLLBACK: each tier can be overridden per environment without a code
 * change — set AI_MODEL_QUALITY / AI_MODEL_PREMIUM / AI_MODEL_UTILITY in
 * Vercel and redeploy. Known-good cheap fallbacks: gpt-4o-mini (quality +
 * utility) and gpt-4o (premium). The request adapter in openai-client.ts
 * handles the parameter differences between model generations, so any mix
 * of old and new models works.
 */
export const MODEL_QUALITY = process.env.AI_MODEL_QUALITY || "gpt-5.4-mini";
export const MODEL_PREMIUM = process.env.AI_MODEL_PREMIUM || "gpt-5.2";
export const MODEL_UTILITY = process.env.AI_MODEL_UTILITY || "gpt-5.4-nano";

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
