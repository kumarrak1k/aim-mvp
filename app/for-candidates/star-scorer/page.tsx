import type { Metadata } from "next";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";
import { STARScorerClient } from "@/app/tools/star-scorer/StarScorerClient";

export const metadata: Metadata = {
  title: { absolute: "Free STAR Answer Scorer | AI Career Mentor" },
};

export default async function CandidateSTARScorerPage() {
  return (
    <CandidateShell currentPath="/for-candidates/star-scorer">
        <STARScorerClient />
      </CandidateShell>
  );
}
