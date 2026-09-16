/**
 * Plan names, safe to import from client components.
 *
 * candidatePlan.ts is the entitlement resolver and imports Clerk's server SDK,
 * so a "use client" component cannot import it. Client code reads a plan NAME
 * off an API response instead, and needs one shared answer to "does this mean
 * full access?" — renaming the paid tier to Pro turned every
 * `planName === "Professional"` check into a permanent false and quietly took
 * paid features away from the people paying for them.
 */

export type CandidatePlanName = "Free" | "Pro";

/** Retired tier names. A comp record or a cached response can still carry one. */
const PRO_PLAN_NAMES = new Set(["Pro", "Professional", "Plus"]);

export function isProPlanName(value: unknown): boolean {
  return typeof value === "string" && PRO_PLAN_NAMES.has(value);
}
