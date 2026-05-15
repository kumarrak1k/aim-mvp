import type { Metadata } from "next";
import { Suspense } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";
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

async function getInitialPlanName(userId: string): Promise<string> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const meta = user.privateMetadata as {
      subscriptionStatus?: string;
      stripePlanId?: string;
    };
    const isActive = meta?.subscriptionStatus === "active";
    const planId = (meta?.stripePlanId ?? "").toLowerCase();
    if (!isActive) return "Free";
    if (planId.includes("professional")) return "Professional";
    if (planId.includes("plus")) return "Plus";
    return "Free";
  } catch {
    return "Free";
  }
}

export default async function PracticePage() {
  const { userId } = await auth();
  const initialPlanName = userId ? await getInitialPlanName(userId) : "Free";

  return (
    <Suspense>
      <PracticePageClient initialPlanName={initialPlanName} />
    </Suspense>
  );
}
