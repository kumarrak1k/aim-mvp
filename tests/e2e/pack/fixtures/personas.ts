/**
 * The candidate persona matrix for the E2E pack.
 *
 * Entitlement is 100% derived from Clerk privateMetadata by
 * resolveCandidatePlan() — so each persona is just a metadata patch, seeded via
 * the Clerk Backend SDK with NO Stripe involvement. Keep this in sync with
 * tests/unit/candidatePlan.persona.test.ts (the pure-resolver matrix), so the
 * seeded users and the unit assertions can never disagree.
 */

export type Persona = {
  key: string;
  email: string;
  privateMetadata: Record<string, unknown>;
  /** Plan the persona should resolve to (for spec-level assertions). */
  planName: "Free" | "Plus" | "Professional";
  /** True if voice/camera modes should be LOCKED on /practice (Free only). */
  voiceLocked: boolean;
};

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const iso = (ms: number) => new Date(ms).toISOString();

export const CANDIDATE_PERSONAS: Persona[] = [
  {
    key: "free",
    email: "free+aimtest@aimtest.dev",
    privateMetadata: { accountType: "candidate", trialConsumed: true, trialEndsAt: "2020-01-01T00:00:00Z" },
    planName: "Free",
    voiceLocked: true,
  },
  {
    key: "trial",
    email: "trial+aimtest@aimtest.dev",
    privateMetadata: {
      accountType: "candidate",
      trialStartedAt: iso(NOW - 0.5 * DAY),
      trialEndsAt: iso(NOW + 6.5 * DAY),
      trialConsumed: true,
    },
    planName: "Professional",
    voiceLocked: false,
  },
  {
    key: "plus",
    email: "plus+aimtest@aimtest.dev",
    privateMetadata: { accountType: "candidate", subscriptionStatus: "active", stripePlanId: "plus_monthly", trialConsumed: true },
    planName: "Plus",
    voiceLocked: false,
  },
  {
    key: "professional",
    email: "pro+aimtest@aimtest.dev",
    privateMetadata: {
      accountType: "candidate",
      subscriptionStatus: "active",
      stripePlanId: "professional_annual",
      trialConsumed: true,
    },
    planName: "Professional",
    voiceLocked: false,
  },
];
