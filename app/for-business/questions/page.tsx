import type { Metadata } from "next";
import { getAllQuestionSets } from "@/app/lib/content";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { QuestionsPageContent } from "@/app/components/pages/QuestionsPageContent";

export const metadata: Metadata = {
  title: "Interview Question Library | AI Career Mentor",
};

export default function BusinessQuestionsPage() {
  const sets = getAllQuestionSets();
  return (
    <AudienceShell audience="business" currentPath="/for-business/questions">
      <QuestionsPageContent sets={sets} />
    </AudienceShell>
  );
}
