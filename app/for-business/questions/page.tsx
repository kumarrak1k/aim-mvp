import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getAllQuestionSets } from "@/app/lib/content";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";
import { QuestionsPageContent } from "@/app/components/pages/QuestionsPageContent";

export const metadata: Metadata = {
  title: "Interview Question Library | AI Career Mentor",
};

export default async function BusinessQuestionsPage() {
  const { userId } = await auth();
  const sets = getAllQuestionSets();

  if (userId) {
    return (
      <CorporateAppShell currentPath="/for-business/questions">
        <QuestionsPageContent sets={sets} />
      </CorporateAppShell>
    );
  }

  return (
    <AudienceShell audience="business" currentPath="/for-business/questions">
      <QuestionsPageContent sets={sets} />
    </AudienceShell>
  );
}
