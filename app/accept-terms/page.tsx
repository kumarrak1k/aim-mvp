import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTosStatus } from "@/app/lib/legal";
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
    redirect(nextPath);
  }

  return <AcceptTermsForm version={status.currentVersion} nextPath={nextPath} />;
}

function sanitiseNext(raw: string | undefined): string {
  if (!raw) return "/practice";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/practice";
  return raw;
}
