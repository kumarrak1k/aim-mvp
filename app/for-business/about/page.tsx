import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";
import { AboutPageContent } from "@/app/components/pages/AboutPageContent";

export const metadata: Metadata = {
  title: "About AI Career Mentor — Mission, Team & Story",
};

export default async function BusinessAboutPage() {
  const { userId } = await auth();

  if (userId) {
    return (
      <CorporateAppShell currentPath="/for-business/about">
        <AboutPageContent />
      </CorporateAppShell>
    );
  }

  return (
    <AudienceShell audience="business" currentPath="/for-business/about">
      <AboutPageContent />
    </AudienceShell>
  );
}
