import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
import { AboutPageContent } from "@/app/components/pages/AboutPageContent";

export const metadata: Metadata = {
  title: "About AI Career Mentor — Mission, Team & Story",
};

export default async function CandidateAboutPage() {
  const { userId } = await auth();

  if (userId) {
    return (
      <CandidateAppShell currentPath="/for-candidates/about">
        <AboutPageContent />
      </CandidateAppShell>
    );
  }

  return (
    <AudienceShell audience="candidate" currentPath="/for-candidates/about">
      <AboutPageContent />
    </AudienceShell>
  );
}
