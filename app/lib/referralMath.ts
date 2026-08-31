/**
 * Pure referral-reward math, kept free of Prisma/Clerk imports so the unit
 * test runs without a generated client (same pattern as stripeSync).
 * Granting lives in referralRewards.ts.
 */

export const ACTIVATIONS_PER_REWARD = 3;
export const REWARD_MONTHS_CAP = 6;

/** Months earned for a given count of activated referrals. */
export function earnedMonths(activatedCount: number): number {
  return Math.min(
    Math.floor(Math.max(0, activatedCount) / ACTIVATIONS_PER_REWARD),
    REWARD_MONTHS_CAP,
  );
}
