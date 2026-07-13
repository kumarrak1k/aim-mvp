/**
 * Corporate plan configuration — single source of truth for seat limits,
 * invite limits, pricing, and trial duration.
 *
 * Enforcement happens in:
 *   POST /api/company/members  — seat limit check before creating invite
 *   POST /api/company/assignments — plan-active + monthly invite limit
 *   POST /api/company/templates   — plan-active check
 *
 * Stripe price IDs are stored in env vars and wired up in stripe.ts
 * once the products are created in the Stripe dashboard.
 */

export const PLAN_CONFIG = {
  team: {
    id: "team",
    name: "Team",
    seats: 3,
    invitesPerMonth: 100,
    priceGBP: 149,
    trialDays: 14,
  },
  business: {
    id: "business",
    name: "Business",
    seats: 10,
    invitesPerMonth: 500,
    priceGBP: 399,
    trialDays: 14,
  },
} as const;

export type CorporatePlanId = keyof typeof PLAN_CONFIG;

/**
 * Fair-usage cap on candidate invites during a free trial (cost control —
 * each assessment a candidate completes drives OpenAI spend). Applies only
 * while planStatus === "trial"; paid plans use the monthly limit instead.
 */
export const CORPORATE_TRIAL_INVITE_CAP = 10;

/** Returns plan config or null if planId is unrecognised / null. */
export function getPlan(planId: string | null | undefined) {
  if (!planId || !(planId in PLAN_CONFIG)) return null;
  return PLAN_CONFIG[planId as CorporatePlanId];
}

/** Candidate invites left in a trial (0 if not on trial or cap reached). */
export function trialInvitesRemaining(company: {
  planStatus: string;
  trialInvitesUsed?: number | null;
}): number {
  if (company.planStatus !== "trial") return 0;
  return Math.max(0, CORPORATE_TRIAL_INVITE_CAP - (company.trialInvitesUsed ?? 0));
}

/**
 * True if the workspace is on an active paid subscription, a live trial, or
 * live admin-granted complimentary access (planStatus "comp": no card, no
 * Stripe, self-expires when compUntil passes).
 */
export function isPlanActive(company: {
  planStatus: string;
  trialEndsAt: Date | null | string | undefined;
  compUntil?: Date | null | string | undefined;
}): boolean {
  if (company.planStatus === "active") return true;
  if (company.planStatus === "trial") {
    const ends = company.trialEndsAt ? new Date(company.trialEndsAt) : null;
    return ends !== null && ends > new Date();
  }
  if (company.planStatus === "comp") {
    const ends = company.compUntil ? new Date(company.compUntil) : null;
    return ends !== null && ends > new Date();
  }
  return false;
}

/** Calendar days remaining in the trial (0 if expired or no trial). */
export function trialDaysRemaining(
  trialEndsAt: Date | null | string | undefined
): number {
  if (!trialEndsAt) return 0;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
