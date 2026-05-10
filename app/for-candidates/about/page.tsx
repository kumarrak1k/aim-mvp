import type { Metadata } from "next";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { AboutPageContent } from "@/app/components/pages/AboutPageContent";

export const metadata: Metadata = {
  title: "About AI Career Mentor — Mission, Team & Story",
};

export default function CandidateAboutPage() {
  return (
    <AudienceShell audience="candidate" currentPath="/for-candidates/about">
      <AboutPageContent />
    </AudienceShell>
  );
}
