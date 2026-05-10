import type { Metadata } from "next";
import { getAllQuestionSets } from "@/app/lib/content";
import { absoluteUrl } from "@/app/config/site";
import { PublicShell } from "@/app/components/marketing/PublicShell";
import { QuestionsPageContent } from "@/app/components/pages/QuestionsPageContent";

export const metadata: Metadata = {
  title: "Interview Question Library | AI Career Mentor",
  description:
    "Thousands of categorised interview questions by role, industry, and interview type — with model answers and scoring guidance.",
  alternates: { canonical: absoluteUrl("/questions") },
};

export default function QuestionsIndexPage() {
  const sets = getAllQuestionSets();

  return (
    <PublicShell currentPath="/questions">
      <QuestionsPageContent sets={sets} />
    </PublicShell>
  );
}
