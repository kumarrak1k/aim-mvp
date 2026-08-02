import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTosStatus } from "@/app/lib/legal";
import { prisma } from "@/app/lib/prisma";
import { AcceptTermsForm } from "./AcceptTermsForm";

export const metadata: Metadata = {
  title: "Confirm Terms",
  description: "Confirm the AI Career Mentor Terms of Use and Privacy Policy.",
  robots: { index: false, follow: false },
};

type AcceptTermsPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AcceptTermsPage({ searchParams }: AcceptTermsPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/for-candidates/sign-in");
  }

  const status = await getTosStatus(userId);
  const params = await searchParams;
  const nextPath = sanitiseNext(params.next);

  if (status.accepted) {
    // Someone who has accepted terms but never been through onboarding is a
    // brand-new candidate. Sending them to an empty practice screen is what
    // left every profile in the database blank; ask first, once.
    // Only when they were headed for the default destination — an explicit
    // ?next (an invite link, a deep link) must still win.
    if (nextPath === "/practice") {
      const profile = await prisma.userProfile.findUnique({
        where: { clerkUserId: userId },
        select: { onboardingCompletedAt: true },
      });
      if (!profile?.onboardingCompletedAt) redirect("/onboarding");
    }
    redirect(nextPath);
  }

  return <AcceptTermsForm version={status.currentVersion} nextPath={nextPath} />;
}

function sanitiseNext(raw: string | undefined): string {
  if (!raw) return "/practice";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/practice";
  return raw;
}
