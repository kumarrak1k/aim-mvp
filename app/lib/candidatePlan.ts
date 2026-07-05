/**
 * Candidate entitlement resolver — the single source of truth for what a
 * candidate is allowed to do.
 *
 * Every feature gate (unlimited sessions, voice/camera, assessment centres,
 * career docs, advanced analytics) MUST route through resolveCandidatePlan()
 * so the reverse trial is honoured everywhere consistently.
 *
 * ── The reverse trial ──────────────────────────────────────────────────────
 * New candidates auto-start a 3-day trial at sign-up (no card). During the
 * trial the effective plan is "plus" — unlimited practice with voice + camera
 * coaching, but NOT the Professional-only features (assessment centres, career
 * docs, advanced analytics). When the trial ends the user silently drops to the
 * Free tier (3 saved sessions, keyboard only). A paid subscription always takes
 * precedence over the trial.
 *
 * Trial state lives in Clerk privateMetadata:
 *   trialStartedAt?: string   (ISO)
 *   trialEndsAt?: string      (ISO)
 *   trialConsumed?: boolean    (true once a trial has ever been granted)
 *
 * Because the Clerk JWT session token maps the whole private_metadata object
 * to `metadata`, the same fields are available from sessionClaims.metadata for
 * fast SSR — resolveCandidatePlanFromClaims() reads those.
 */

import { clerkClient } from "@clerk/nextjs/server";

/** Length of the candidate reverse trial, in days. */
export const TRIAL_DURATION_DAYS = 3;

/**
 * Fair-usage caps that apply ONLY during an active free trial. The trial grants
 * Plus, so practiceSessions is the cap that actually bites. assessmentCentres
 * and careerDocs are Professional-only features the Plus trial can't reach —
 * their caps are kept purely as a backstop (and in case the trial tier ever
 * changes). Counts are measured from trialStartedAt; real paid subscriptions
 * are genuinely unlimited.
 */
export const TRIAL_USAGE_CAPS = {
  /** Practice interviews that can be saved during the trial. */
  practiceSessions: 15,
  /** Backstop only — assessment centres are Professional-only (trial = Plus). */
  assessmentCentres: 2,
  /** Backstop only — career docs are Professional-only (trial = Plus). */
  careerDocs: 5,
} as const;

export type CandidatePlanName = "Free" | "Plus" | "Professional";
export type EffectivePlan = "free" | "plus" | "professional";

/** The shape of the billing/trial fields we read out of Clerk metadata. */
export type CandidateBillingMeta = {
  subscriptionStatus?: string;
  stripePlanId?: string;
  subscriptionCurrentPeriodEnd?: number;
  trialStartedAt?: string;
  trialEndsAt?: string;
  trialConsumed?: boolean;
};

export type CandidatePlan = {
  /** Display name of the EFFECTIVE plan (an active trial shows as "Plus"). */
  planName: CandidatePlanName;
  /** Lowercase effective plan for gating logic. */
  effectivePlan: EffectivePlan;
  /** True if the user has any paid or trial access (i.e. not Free). */
  isActive: boolean;
  /** True if the user gets unlimited sessions (Plus, Professional, or trial). */
  isUnlimited: boolean;
  /** True if the user gets Professional-only features (or is on trial). */
  isProfessional: boolean;
  /** True if the access is coming from the free trial (not a paid plan). */
  isTrial: boolean;
  /** Whether a trial has ever been granted to this user. */
  trialConsumed: boolean;
  /** The actual PAID plan name (for billing UI; "Free" if none). */
  paidPlanName: CandidatePlanName;
  /** True if there is a genuine active paid subscription. */
  isPaid: boolean;
  /** True while a paid subscription is past_due (Stripe dunning grace window). */
  isPastDue: boolean;
  /** ISO trial end, or null. */
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  /** Whole calendar days remaining in the trial (0 if none/expired). */
  trialDaysRemaining: number;
};

function daysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Pure resolver — derives the effective candidate plan from raw metadata.
 * Works with either Clerk privateMetadata or JWT sessionClaims.metadata
 * (both carry the same fields).
 */
export function resolveCandidatePlan(
  meta: CandidateBillingMeta | null | undefined
): CandidatePlan {
  // ── Paid subscription (Stripe "trialing" is a card-on-file Stripe trial and
  //    is treated as paid/active). `past_due` keeps FULL access during Stripe's
  //    dunning / Smart-Retries grace window — mirroring the corporate side. The
  //    subscription only really ends when Stripe flips it to canceled/unpaid, at
  //    which point the webhook drops the user. isPastDue drives an "update your
  //    card" banner so the user can fix payment before access is lost. ─────────
  const isPaid =
    meta?.subscriptionStatus === "active" ||
    meta?.subscriptionStatus === "trialing" ||
    meta?.subscriptionStatus === "past_due";
  const isPastDue = meta?.subscriptionStatus === "past_due";
  const planId = (meta?.stripePlanId ?? "").toLowerCase();

  let paidPlanName: CandidatePlanName = "Free";
  if (isPaid) {
    if (planId.includes("professional")) paidPlanName = "Professional";
    else if (planId.includes("plus")) paidPlanName = "Plus";
  }

  // ── Reverse trial (no card; independent of Stripe). ───────────────────────
  const trialStartedAt = meta?.trialStartedAt ?? null;
  const trialEndsAt = meta?.trialEndsAt ?? null;
  const trialActive =
    !!trialEndsAt && new Date(trialEndsAt).getTime() > Date.now();

  // ── Effective plan: a real paid plan always wins; otherwise an active trial
  //    grants Professional; otherwise Free. ───────────────────────────────────
  let effectivePlan: EffectivePlan = "free";
  let isTrial = false;

  if (paidPlanName === "Professional") {
    effectivePlan = "professional";
  } else if (paidPlanName === "Plus") {
    effectivePlan = "plus";
  } else if (trialActive) {
    // The reverse trial grants Plus (voice + camera + unlimited practice), NOT
    // Professional — assessment centres and career docs stay paid-only.
    effectivePlan = "plus";
    isTrial = true;
  }

  const planName: CandidatePlanName =
    effectivePlan === "professional"
      ? "Professional"
      : effectivePlan === "plus"
      ? "Plus"
      : "Free";

  return {
    planName,
    effectivePlan,
    isActive: effectivePlan !== "free",
    isUnlimited: effectivePlan !== "free",
    isProfessional: effectivePlan === "professional",
    isTrial,
    trialConsumed: meta?.trialConsumed === true,
    paidPlanName,
    isPaid: paidPlanName !== "Free",
    isPastDue,
    trialStartedAt,
    trialEndsAt,
    trialDaysRemaining: daysRemaining(trialEndsAt),
  };
}

/**
 * Server helper — fetches the user from Clerk and resolves their plan.
 * Use in API routes. Falls back to Free on any error (fail-closed).
 */
export async function getCandidatePlan(userId: string): Promise<CandidatePlan> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return resolveCandidatePlan(user.privateMetadata as CandidateBillingMeta);
  } catch {
    return resolveCandidatePlan(null);
  }
}

/**
 * SSR helper — resolves the plan from JWT session claims (no Clerk API call).
 * The Clerk JWT template maps private_metadata → `metadata`.
 */
export function resolveCandidatePlanFromClaims(
  sessionClaims: { metadata?: CandidateBillingMeta } | null | undefined
): CandidatePlan {
  return resolveCandidatePlan(sessionClaims?.metadata ?? null);
}

/**
 * Reliable server gate for cost-bearing routes.
 *
 * Resolves from JWT claims first (fast, no network). If the claims do NOT grant
 * access, it confirms against the authoritative Clerk profile (privateMetadata
 * via the Backend API) before denying.
 *
 * Why: the claims-only path depends on the Clerk session-token template mapping
 * private_metadata → `metadata`. If that mapping is absent or misconfigured,
 * claims resolve EVERY user to Free — silently 403-ing paid/trial users out of
 * voice and other gated features. This helper makes the gate correct regardless
 * of that template: entitled users with populated claims keep the fast path, and
 * the extra Clerk call only happens for users who look non-entitled from claims.
 * Free users are still correctly denied, so cost protection is preserved.
 */
export async function resolveCandidatePlanReliable(
  userId: string,
  sessionClaims: { metadata?: CandidateBillingMeta } | null | undefined
): Promise<CandidatePlan> {
  const fromClaims = resolveCandidatePlanFromClaims(sessionClaims);
  if (fromClaims.isUnlimited) return fromClaims;
  return getCandidatePlan(userId);
}

/**
 * Start the reverse trial for a candidate, if they are eligible.
 *
 * Idempotent and safe to call repeatedly:
 *   - never for superadmin accounts
 *   - never more than once (guarded by trialConsumed)
 *   - never for someone who already has a paid subscription
 *
 * Clerk's updateUserMetadata shallow-merges, so existing fields
 * (accountType, billing) are preserved.
 */
export async function startCandidateTrialIfEligible(
  userId: string
): Promise<{ started: boolean; trialEndsAt: string | null; reason?: string }> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.privateMetadata as CandidateBillingMeta & { role?: string };

  if (meta?.role === "superadmin") {
    return { started: false, trialEndsAt: null, reason: "superadmin" };
  }
  if (meta?.trialConsumed === true) {
    return {
      started: false,
      trialEndsAt: meta.trialEndsAt ?? null,
      reason: "already_consumed",
    };
  }
  if (resolveCandidatePlan(meta).isPaid) {
    return { started: false, trialEndsAt: null, reason: "already_paid" };
  }

  const now = new Date();
  const endsAt = new Date(
    now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000
  );

  await client.users.updateUserMetadata(userId, {
    privateMetadata: {
      trialStartedAt: now.toISOString(),
      trialEndsAt: endsAt.toISOString(),
      trialConsumed: true,
    },
  });

  return { started: true, trialEndsAt: endsAt.toISOString() };
}
