import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getAllQuestionSets } from "@/app/lib/content";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
import { QuestionsPageContent } from "@/app/components/pages/QuestionsPageContent";

export const metadata: Metadata = {
  title: { absolute: "Interview Question Library | AI Career Mentor" },
};

export default async function CandidateQuestionsPage() {
  const { userId } = await auth();
  const sets = getAllQuestionSets();

  if (userId) {
    return (
      <CandidateAppShell currentPath="/for-candidates/questions">
        <QuestionsPageContent sets={sets} />
      </CandidateAppShell>
    );
  }

  return (
    <AudienceShell audience="candidate" currentPath="/for-candidates/questions">
      <QuestionsPageContent sets={sets} />
    </AudienceShell>
  );
}
