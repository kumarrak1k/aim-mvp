import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/app/lib/prisma";
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
    },
  });

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

  const user = await currentUser();
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
