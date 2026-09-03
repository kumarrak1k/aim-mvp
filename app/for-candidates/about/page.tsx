import type { Metadata } from "next";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";
import { AboutPageContent } from "@/app/components/pages/AboutPageContent";

export const metadata: Metadata = {
  title: "About AI Career Mentor: Mission, Team & Story",
};

export default async function CandidateAboutPage() {
  return (
    <CandidateShell currentPath="/for-candidates/about">
        <AboutPageContent />
      </CandidateShell>
  );
}
