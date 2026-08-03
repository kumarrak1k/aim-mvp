import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTosStatus } from "@/app/lib/legal";
import { resolvePostAuthDestination } from "@/app/lib/postAuthDestination";
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

  // Resolved once and used for BOTH branches. Someone who has just accepted
  // terms is by definition new, so sending them to nextPath directly — as this
  // did — skipped onboarding for exactly the users it exists for. An explicit
  // ?next (an emailed invite, a deep link) still wins inside the helper.
  const destination = await resolvePostAuthDestination(userId, nextPath);

  if (status.accepted) {
    redirect(destination);
  }

  return <AcceptTermsForm version={status.currentVersion} nextPath={destination} />;
}

function sanitiseNext(raw: string | undefined): string {
  if (!raw) return "/practice";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/practice";
  return raw;
}
