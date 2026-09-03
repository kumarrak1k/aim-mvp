import type { Metadata } from "next";
import { getAllQuestionSets } from "@/app/lib/content";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";
import { QuestionsPageContent } from "@/app/components/pages/QuestionsPageContent";

export const metadata: Metadata = {
  title: { absolute: "Interview Question Library | AI Career Mentor" },
};

export default async function CandidateQuestionsPage() {
  const sets = getAllQuestionSets();

  return (
    <CandidateShell currentPath="/for-candidates/questions">
      <QuestionsPageContent sets={sets} />
    </CandidateShell>
  );
}
