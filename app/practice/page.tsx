import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { createPageMetadata } from "@/app/config/seo";
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

/**
 * Derives the initial plan name from JWT session claims — no Clerk API call
 * required, so this never fails due to a Clerk API 500 error.
 */
function planNameFromClaims(
  sessionClaims: Record<string, unknown> | null
): string {
  const meta = (
    sessionClaims as {
      metadata?: { subscriptionStatus?: string; stripePlanId?: string };
    } | null
  )?.metadata;

  const isActive =
    meta?.subscriptionStatus === "active" ||
    meta?.subscriptionStatus === "trialing";
  if (!isActive) return "Free";

  const planId = (meta?.stripePlanId ?? "").toLowerCase();
  if (planId.includes("professional")) return "Professional";
  if (planId.includes("plus")) return "Plus";
  return "Free";
}

export default async function PracticePage() {
  const { userId, sessionClaims } = await auth();
  const initialPlanName = userId
    ? planNameFromClaims(sessionClaims as Record<string, unknown> | null)
    : "Free";

  return (
    <Suspense>
      <PracticePageClient initialPlanName={initialPlanName} />
    </Suspense>
  );
}
