import type { Metadata } from "next";
import { createPageMetadata } from "@/app/config/seo";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";
import { AboutPageContent } from "@/app/components/pages/AboutPageContent";

export const metadata: Metadata = createPageMetadata({
  path: "/about",
  title: "About: Mission & Story",
});

export default function AboutPage() {
  return (
    <CandidateShell currentPath="/about">
      <AboutPageContent />
    </CandidateShell>
  );
}
