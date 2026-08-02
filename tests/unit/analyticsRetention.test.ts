/**
 * Retention scope.
 *
 * The prune cron enforces a promise made on the privacy page, so two failures
 * matter in opposite directions: retaining behavioural telemetry past the
 * stated period breaches the policy, and pruning service-side events would
 * silently destroy the funnel history the table exists to provide.
 *
 * These pin the split so that adding a new event type cannot quietly land on
 * the wrong side of it.
 */
import { describe, it, expect } from "vitest";
import {
  ACTIVITY_EVENTS,
  ANALYTICS_EVENTS,
  ANALYTICS_RETENTION_DAYS,
} from "../../app/lib/activity";

describe("analytics retention scope", () => {
  it("matches the 12 months stated on the privacy page", () => {
    expect(ANALYTICS_RETENTION_DAYS).toBe(365);
  });

  it("prunes exactly the consent-based behavioural events", () => {
    expect([...ANALYTICS_EVENTS].sort()).toEqual(
      [
        ACTIVITY_EVENTS.PAGE_VIEW,
        ACTIVITY_EVENTS.INTERACTION,
        ACTIVITY_EVENTS.TOOL_USED,
        ACTIVITY_EVENTS.CHAT_MESSAGE,
      ].sort()
    );
  });

  it("never prunes service-side events — they are the funnel history", () => {
    const mustSurvive = [
      ACTIVITY_EVENTS.PRACTICE_STARTED,
      ACTIVITY_EVENTS.PRACTICE_COMPLETED,
      ACTIVITY_EVENTS.PRACTICE_CAPPED,
      ACTIVITY_EVENTS.AC_STARTED,
      ACTIVITY_EVENTS.AC_STAGE_SUBMITTED,
      ACTIVITY_EVENTS.AC_BLOCKED,
      ACTIVITY_EVENTS.CAREER_DOC_BLOCKED,
      // Onboarding is service-side: it records what the product asked and what
      // the candidate answered, not how they browsed, and it is collected
      // without an analytics opt-in. Pruning it would destroy the record of
      // which answers correlate with users who go on to complete sessions.
      ACTIVITY_EVENTS.ONBOARDING_COMPLETED,
      ACTIVITY_EVENTS.ONBOARDING_SKIPPED,
    ];
    for (const event of mustSurvive) {
      expect(ANALYTICS_EVENTS as readonly string[]).not.toContain(event);
    }
  });

  it("classifies every known event as either pruned or retained", () => {
    // Forces a deliberate decision when a new event is added, rather than
    // letting it default to indefinite retention by omission.
    const all = Object.values(ACTIVITY_EVENTS);
    const pruned = new Set<string>(ANALYTICS_EVENTS);
    const retained = all.filter((e) => !pruned.has(e));
    expect(pruned.size + retained.length).toBe(all.length);
    expect(all.length).toBe(13);
  });
});
