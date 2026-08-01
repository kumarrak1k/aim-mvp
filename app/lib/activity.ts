import { prisma } from "./prisma";
import type { CandidatePlan } from "./candidatePlan";

/**
 * Activity instrumentation.
 *
 * Existing tables record only COMPLETED work, so a user who starts a practice
 * interview and abandons it (or is rejected by a plan gate) leaves no trace at
 * all — indistinguishable from a user who never tried. These events make the
 * attempt visible so funnel drop-off can actually be measured.
 *
 * Every write is fire-and-forget: instrumentation must never fail, slow, or
 * change the behaviour of the request it is observing.
 */

export const ACTIVITY_EVENTS = {
  /** First question of a practice interview was generated. */
  PRACTICE_STARTED: "practice_started",
  /** A practice interview was completed and saved. */
  PRACTICE_COMPLETED: "practice_completed",
  /** A practice save was refused because a usage cap was hit. */
  PRACTICE_CAPPED: "practice_capped",
  /** An assessment centre session was created. */
  AC_STARTED: "ac_started",
  /** An assessment centre stage was submitted. */
  AC_STAGE_SUBMITTED: "ac_stage_submitted",
  /**
   * An assessment centre was refused because the plan does not include it.
   * This is the demand signal for the Professional tier — it counts users who
   * WANTED the feature and were turned away.
   */
  AC_BLOCKED: "ac_blocked",
  /** A career-doc generation was refused because the plan does not include it. */
  CAREER_DOC_BLOCKED: "career_doc_blocked",

  // ── Behavioural telemetry (client-reported, see /api/activity) ────────────
  /**
   * One page view. detail: { path, visitId, dwellMs?, referrer? }.
   * `visitId` groups views into a single sitting, which is what makes visit
   * counts, time-on-site and the exit page derivable from this one event.
   */
  PAGE_VIEW: "page_view",
  /** A meaningful in-page action. detail: { action, path, visitId, meta? }. */
  INTERACTION: "interaction",
  /** A free/standalone tool was run. detail: { tool, visitId? }. */
  TOOL_USED: "tool_used",
  /** A message was sent to the AI mentor chat. detail: { chars, topic? }. */
  CHAT_MESSAGE: "chat_message",
} as const;

export type ActivityEventName =
  (typeof ACTIVITY_EVENTS)[keyof typeof ACTIVITY_EVENTS];

/**
 * Consent-based behavioural telemetry — the events the privacy policy promises
 * to delete after ANALYTICS_RETENTION_DAYS.
 *
 * The service-side events in this table (practice starts and completions,
 * assessment centre progress, plan-blocked attempts) are deliberately NOT
 * listed. They record what the product did for a user rather than how they
 * browsed, are collected without an analytics opt-in, and are what makes
 * historical funnel analysis possible — pruning them would destroy the
 * drop-off history the table exists to provide.
 *
 * Anything added to ACTIVITY_EVENTS that tracks browsing behaviour must be
 * added here too, or it will be retained indefinitely in breach of the policy.
 */
export const ANALYTICS_EVENTS = [
  ACTIVITY_EVENTS.PAGE_VIEW,
  ACTIVITY_EVENTS.INTERACTION,
  ACTIVITY_EVENTS.TOOL_USED,
  ACTIVITY_EVENTS.CHAT_MESSAGE,
] as const;

/** Must match the retention period stated on the privacy page. */
export const ANALYTICS_RETENTION_DAYS = 365;

type PlanContext = Pick<CandidatePlan, "effectivePlan" | "isTrial">;

/**
 * Record one activity event. Never throws and never blocks — callers should
 * NOT await this in a hot path unless they need ordering.
 */
export function recordActivity(
  clerkUserId: string,
  event: ActivityEventName,
  plan?: PlanContext | null,
  detail?: Record<string, unknown>
): void {
  try {
    // Guarded rather than called directly: this runs inside routes that unit
    // tests exercise with a partial prisma mock. Instrumentation that throws
    // when the delegate is absent would make adding an event a breaking change
    // for every existing test of the route it observes — the opposite of
    // "never affects the code it measures".
    const delegate = prisma?.activityEvent;
    if (!delegate?.create) return;

    void Promise.resolve(
      delegate.create({
        data: {
          clerkUserId,
          event,
          plan: plan?.effectivePlan ?? null,
          isTrial: plan?.isTrial ?? false,
          detail: detail ? (detail as object) : undefined,
        },
      })
    ).catch(() => {
      // Diagnostics must never break the request they observe.
    });
  } catch {
    // As above — including synchronous throws from a mock.
  }
}
