import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
import { STARScorerClient } from "@/app/tools/star-scorer/StarScorerClient";

export const metadata: Metadata = {
  title: "Free STAR Answer Scorer | AI Career Mentor",
};

export default async function CandidateSTARScorerPage() {
  const { userId } = await auth();

  if (userId) {
    return (
      <CandidateAppShell currentPath="/for-candidates/star-scorer">
        <STARScorerClient />
      </CandidateAppShell>
    );
  }

  return (
    <AudienceShell audience="candidate" currentPath="/for-candidates/star-scorer">
      <STARScorerClient />
    </AudienceShell>
  );
}
