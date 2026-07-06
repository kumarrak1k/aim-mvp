import type { Metadata } from "next";
import { getAllQuestionSets } from "@/app/lib/content";
import { absoluteUrl } from "@/app/config/site";
import { PublicShell } from "@/app/components/marketing/PublicShell";
import { QuestionsPageContent } from "@/app/components/pages/QuestionsPageContent";

const _ogImage = absoluteUrl("/brand/logo.jpg");

export const metadata: Metadata = {
  title: { absolute: "Interview Question Library | AI Career Mentor" },
  description:
    "Thousands of categorised interview questions by role, industry, and interview type, with model answers and scoring guidance.",
  alternates: { canonical: absoluteUrl("/questions") },
  openGraph: {
    title: "Interview Question Library | AI Career Mentor",
    description:
      "Thousands of categorised interview questions by role, industry, and interview type, with model answers and scoring guidance.",
    url: absoluteUrl("/questions"),
    siteName: "AI Career Mentor",
    type: "website",
    images: [{ url: _ogImage, width: 1200, height: 1200, alt: "AI Career Mentor Interview Question Library" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interview Question Library | AI Career Mentor",
    description:
      "Thousands of categorised interview questions by role, industry, and interview type, with model answers and scoring guidance.",
    images: [_ogImage],
  },
};

export default function QuestionsIndexPage() {
  const sets = getAllQuestionSets();

  return (
    <PublicShell currentPath="/questions">
      <QuestionsPageContent sets={sets} />
    </PublicShell>
  );
}
