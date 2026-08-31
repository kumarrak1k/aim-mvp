import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";

/**
 * Referral rewards: 1 free month of Plus for every 3 referred friends who
 * ACTIVATE (complete at least one practice session), capped lifetime.
 *
 * Activation, not sign-up, is the counted event: sign-ups are farmable with
 * throwaway emails, a completed practice session is not worth faking three
 * times. Self-referrals are already blocked at /api/referral/use.
 *
 * Months are granted through the existing complimentary-access mechanism
 * (Clerk privateMetadata compPlan/compUntil, see candidatePlan.ts): no card,
 * no Stripe, expires automatically, and a paid plan always outranks it - so
 * a paying referrer banks the months for whenever their paid plan ends.
 *
 * Grants are evaluated lazily whenever /api/referral is called (the /refer
 * page loads it), with an optimistic claim on rewardedMonths so two
 * concurrent requests cannot double-grant.
 */

import {
  ACTIVATIONS_PER_REWARD,
  REWARD_MONTHS_CAP,
  earnedMonths,
} from "@/app/lib/referralMath";

export { ACTIVATIONS_PER_REWARD, REWARD_MONTHS_CAP, earnedMonths };

export type ReferralRewardState = {
  activatedCount: number;
  rewardedMonths: number;
  capReached: boolean;
  /** Activated friends counted towards the NEXT month (0..2); 0 at cap. */
  towardsNext: number;
};

export async function evaluateReferralRewards(
  userId: string,
): Promise<ReferralRewardState> {
  const referral = await prisma.referral.findUnique({
    where: { userId },
    include: { uses: { select: { newUserId: true } } },
  });
  if (!referral) {
    return { activatedCount: 0, rewardedMonths: 0, capReached: false, towardsNext: 0 };
  }

  const referredIds = referral.uses.map((u) => u.newUserId);
  let activatedCount = 0;
  if (referredIds.length > 0) {
    const activated = await prisma.practiceSession.groupBy({
      by: ["clerkUserId"],
      where: { clerkUserId: { in: referredIds } },
    });
    activatedCount = activated.length;
  }

  const earned = earnedMonths(activatedCount);
  let rewardedMonths = referral.rewardedMonths;
  const toGrant = earned - rewardedMonths;

  if (toGrant > 0) {
    // Claim first (optimistic lock on the current value), then write to
    // Clerk; release the claim if the grant cannot be applied.
    const claimed = await prisma.referral.updateMany({
      where: { id: referral.id, rewardedMonths },
      data: { rewardedMonths: earned },
    });

    if (claimed.count === 1) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const meta = (user.privateMetadata ?? {}) as Record<string, unknown>;
        const compPlan = String(meta.compPlan ?? "").toLowerCase();
        const compUntil =
          typeof meta.compUntil === "string" ? meta.compUntil : null;
        const compActive =
          !!compUntil && new Date(compUntil).getTime() > Date.now();

        if (compPlan === "professional" && compActive) {
          // Never downgrade an active admin-granted Professional comp;
          // release the claim so the months grant once it has expired.
          await prisma.referral.update({
            where: { id: referral.id },
            data: { rewardedMonths },
          });
        } else {
          const base =
            compPlan === "plus" && compActive
              ? new Date(compUntil as string)
              : new Date();
          const until = new Date(base);
          until.setMonth(until.getMonth() + toGrant);
          await client.users.updateUserMetadata(userId, {
            privateMetadata: {
              ...meta,
              compPlan: "plus",
              compUntil: until.toISOString(),
            },
          });
          rewardedMonths = earned;
        }
      } catch (err) {
        // Release the claim so the grant retries on the next visit.
        await prisma.referral
          .update({ where: { id: referral.id }, data: { rewardedMonths } })
          .catch(() => {});
        console.error("referral reward grant failed", err);
      }
    } else {
      // A concurrent request already granted.
      rewardedMonths = earned;
    }
  }

  const capReached = rewardedMonths >= REWARD_MONTHS_CAP;
  return {
    activatedCount,
    rewardedMonths,
    capReached,
    towardsNext: capReached ? 0 : activatedCount % ACTIVATIONS_PER_REWARD,
  };
}
