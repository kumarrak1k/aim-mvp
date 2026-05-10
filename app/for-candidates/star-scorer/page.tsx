import type { Metadata } from "next";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { STARScorerClient } from "@/app/tools/star-scorer/StarScorerClient";

export const metadata: Metadata = {
  title: "Free STAR Answer Scorer | AI Career Mentor",
};

export default function CandidateSTARScorerPage() {
  return (
    <AudienceShell audience="candidate" currentPath="/for-candidates/star-scorer">
      <STARScorerClient />
    </AudienceShell>
  );
}
