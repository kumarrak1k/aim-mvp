import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";
import { STARScorerClient } from "@/app/tools/star-scorer/StarScorerClient";

export const metadata: Metadata = {
  title: "Free STAR Answer Scorer | AI Career Mentor",
};

export default async function BusinessSTARScorerPage() {
  const { userId } = await auth();

  if (userId) {
    return (
      <CorporateAppShell currentPath="/for-business/star-scorer">
        <STARScorerClient />
      </CorporateAppShell>
    );
  }

  return (
    <AudienceShell audience="business" currentPath="/for-business/star-scorer">
      <STARScorerClient />
    </AudienceShell>
  );
}
