import type { Metadata } from "next";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { AboutPageContent } from "@/app/components/pages/AboutPageContent";

export const metadata: Metadata = {
  title: "About AI Career Mentor — Mission, Team & Story",
};

export default function BusinessAboutPage() {
  return (
    <AudienceShell audience="business" currentPath="/for-business/about">
      <AboutPageContent />
    </AudienceShell>
  );
}
