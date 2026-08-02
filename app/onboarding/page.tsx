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
    select: { onboardingCompletedAt: true },
  });

  if (profile?.onboardingCompletedAt) redirect("/practice");

  const user = await currentUser();
  const firstName = user?.firstName?.trim() ?? "";

  return (
    <div className="relative min-h-screen bg-[#0a0614] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
      </div>
      <div className="relative z-10">
        <OnboardingClient firstName={firstName} />
      </div>
    </div>
  );
}
