import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";
import { createPageMetadata } from "@/app/config/seo";
import {
  resolveCandidatePlanFromClaims,
  type CandidateBillingMeta,
} from "@/app/lib/candidatePlan";
import { PracticePageClient } from "./components/PracticePageClient";

export const metadata: Metadata = createPageMetadata({
  path: "/practice",
  title: "AI Mock Interview Practice",
  description:
    "Start a tailored AI mock interview with answer feedback, voice delivery coaching, camera presence analysis and stronger model answers.",
  keywords: [
    "AI mock interview practice",
    "AI interview practice",
    "voice interview practice",
    "camera interview practice",
    "interview answer feedback",
    "practice interview questions",
  ],
});

export default async function PracticePage() {
  const { userId, sessionClaims } = await auth();

  // First-run gate. The post-auth resolver only runs at sign-in, so any entry
  // path that lands here directly — Stripe's checkout success_url, bookmarks,
  // shared links — could otherwise show a brand-new candidate the practice
  // page before they have ever seen onboarding. Same semantics as
  // resolvePostAuthDestination (finished OR skipped counts as done), and fails
  // open: a database blip must never lock a candidate out of practice.
  let needsOnboarding = false;
  if (userId) {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { clerkUserId: userId },
        select: { onboardingCompletedAt: true },
      });
      needsOnboarding = !profile?.onboardingCompletedAt;
    } catch {}
  }
  if (needsOnboarding) redirect("/onboarding");

  // Resolve the initial plan from JWT session claims — no Clerk API call, so
  // this never fails on a Clerk API 500. Honours the reverse trial (an active
  // trial resolves to "Professional").
  const initialPlanName = userId
    ? resolveCandidatePlanFromClaims(
        sessionClaims as { metadata?: CandidateBillingMeta } | null
      ).planName
    : "Free";

  return (
    <Suspense>
      <PracticePageClient initialPlanName={initialPlanName} />
    </Suspense>
  );
}
