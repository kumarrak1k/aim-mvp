import type { Metadata } from "next";
import Link from "next/link";
import { getAllQuestionSets } from "@/app/lib/content";
import { absoluteUrl } from "@/app/config/site";
import { PublicShell } from "@/app/components/marketing/PublicShell";
import { QuestionsClient } from "./components/QuestionsClient";

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
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
        <header className="mb-10 mt-10 border-b border-white/[0.08] pb-10">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-purple-300/80">
            Interview question library
          </p>
          <h1 className="text-[2.2rem] font-black leading-[1.05] tracking-[-0.05em] sm:text-4xl">
            Questions for every role and interview type.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-gray-400">
            {sets.length}+ question sets covering competency, behavioural, technical, and
            case study formats — with model answers and scoring guidance.
          </p>
        </header>

        <QuestionsClient sets={sets} />

        <div className="mt-14 border-t border-white/[0.07] pt-10 text-center">
          <p className="text-sm text-gray-500">
            Want AI-generated questions tailored to your exact role?{" "}
            <Link
              href="/for-candidates/sign-up"
              className="font-black text-purple-300 hover:text-purple-200"
            >
              Start free →
            </Link>
          </p>
        </div>
      </div>
    </PublicShell>
  );
}
