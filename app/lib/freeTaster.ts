/**
 * Taster access to the Professional-only features.
 *
 * The mock assessment centre and the CV & Application Studio are the two things
 * no competitor offers, and until now they sat entirely behind the top tier —
 * so nobody who had not already paid could ever see what they would be paying
 * for. A non-paying candidate now gets a small, LIFETIME allowance of each
 * (see FREE_TIER in candidatePlan.ts), after which the upgrade gate returns.
 *
 * Kept out of candidatePlan.ts deliberately: that module stays free of Prisma
 * so its unit tests run without a generated client.
 */

import { prisma } from "./prisma";
import { FREE_TIER, type CandidatePlan } from "./candidatePlan";

/**
 * How many assessment centres this user has run under their own steam.
 * Company-funded sessions (created from a corporate invite) are excluded —
 * they are paid for by the employer and must not consume a personal taster.
 */
async function selfServeCentresUsed(userId: string): Promise<number> {
  return prisma.assessmentCentreSession.count({
    where: { clerkUserId: userId, assignmentToken: null },
  });
}

/** How many taster assessment centres this user has left (0 for Professional). */
export async function remainingAssessmentCentreTasters(
  userId: string
): Promise<number> {
  const used = await selfServeCentresUsed(userId);
  return Math.max(0, FREE_TIER.assessmentCentres - used);
}

export type TasterDecision =
  | { allowed: true; isTaster: boolean; used: number }
  | { allowed: false; used: number };

/**
 * May this user START a self-serve assessment centre?
 *
 * Professional (paid, comp, or any future tier that sets isProfessional) is
 * unrestricted. Everyone else gets FREE_TIER.assessmentCentres for life.
 */
export async function canStartAssessmentCentre(
  userId: string,
  plan: CandidatePlan
): Promise<TasterDecision> {
  if (plan.isProfessional) return { allowed: true, isTaster: false, used: 0 };

  const used = await selfServeCentresUsed(userId);
  if (used < FREE_TIER.assessmentCentres) {
    return { allowed: true, isTaster: true, used };
  }
  return { allowed: false, used };
}

/**
 * May this user SUBMIT a stage of an assessment centre they already own?
 *
 * Submits are re-checked so someone who lapsed or downgraded mid-flow cannot
 * keep generating AI scoring. A taster user legitimately holds one session, so
 * they must be able to finish it — but only while their session count is still
 * within the taster allowance, which keeps the original lapsed-user protection
 * intact for anyone who built up sessions on a plan they no longer hold.
 */
export async function canSubmitAssessmentCentreStage(
  userId: string,
  plan: CandidatePlan
): Promise<boolean> {
  if (plan.isProfessional) return true;
  const used = await selfServeCentresUsed(userId);
  return used <= FREE_TIER.assessmentCentres;
}
