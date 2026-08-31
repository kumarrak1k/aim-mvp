import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { prisma } from "@/app/lib/prisma";
import { recordSignupTosAcceptanceIfEligible } from "@/app/lib/legal";
import { OnboardingClient } from "./OnboardingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Get set up",
  robots: { index: false, follow: false },
};

/**
 * Shown once, straight after terms acceptance.
 *
 * Anyone who has already been through it — completed OR skipped — goes to
 * practice. Re-asking someone who declined is how a one-time flow turns into a
 * recurring obstacle.
 */
export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/for-candidates/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: {
      onboardingCompletedAt: true,
      targetRole: true,
      targetSector: true,
      biggestChallenge: true,
      processType: true,
      defaultExperienceLevel: true,
      tosAcceptedVersion: true,
    },
  });

  const user = await currentUser();

  // Backup for the sign-up terms stamp (primary lives in the post-signup
  // /api/account-type call): the sign-up form disclosed the agreement, so
  // record the FIRST acceptance here rather than interrupting the path to
  // the first question with the /accept-terms wall (activation audit F2).
  if (!profile?.tosAcceptedVersion) {
    try {
      await recordSignupTosAcceptanceIfEligible(userId, await headers());
    } catch {
      // Non-fatal — /accept-terms remains as the final backstop.
    }
  }

  if (profile?.onboardingCompletedAt) redirect("/practice");

  // Answers saved but no completion stamp = an interrupted run (refresh or
  // closed tab mid-flow). Resume at the warm-up rather than re-asking everything.
  const resumeAnswers =
    profile?.targetRole && profile.targetSector && profile.biggestChallenge && profile.processType
      ? {
          targetRole: profile.targetRole,
          careerStage: profile.defaultExperienceLevel ?? "",
          targetSector: profile.targetSector,
          biggestChallenge: profile.biggestChallenge,
          processType: profile.processType,
        }
      : null;

  const firstName = user?.firstName?.trim() ?? "";

  return (
    <div className="relative min-h-screen bg-background text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 page-glow" />
      </div>
      <div className="relative z-10">
        <OnboardingClient firstName={firstName} resumeAnswers={resumeAnswers} />
      </div>
    </div>
  );
}
