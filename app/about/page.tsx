import type { Metadata } from "next";
import { createPageMetadata } from "@/app/config/seo";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { AboutPageContent } from "@/app/components/pages/AboutPageContent";

export const metadata: Metadata = createPageMetadata({
  path: "/about",
  title: "About: Mission & Story",
});

export default function AboutPage() {
  return (
    <AudienceShell audience="candidate" currentPath="/about">
      <AboutPageContent />
    </AudienceShell>
  );
}
