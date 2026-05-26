import type { Metadata } from "next";
import { createPageMetadata } from "@/app/config/seo";
import { PublicShell } from "@/app/components/marketing/PublicShell";
import { AboutPageContent } from "@/app/components/pages/AboutPageContent";

export const metadata: Metadata = createPageMetadata({
  path: "/about",
  title: "About AI Career Mentor — Mission & Story",
});

export default function AboutPage() {
  return (
    <PublicShell currentPath="/about">
      <AboutPageContent />
    </PublicShell>
  );
}
