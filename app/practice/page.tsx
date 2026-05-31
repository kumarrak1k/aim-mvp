import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
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
