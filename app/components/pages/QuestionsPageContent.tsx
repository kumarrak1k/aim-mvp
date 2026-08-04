import Link from "next/link";
import type { getAllQuestionSets } from "@/app/lib/content";
import { QuestionsClient } from "@/app/questions/components/QuestionsClient";

export function QuestionsPageContent({
  sets,
}: {
  sets: ReturnType<typeof getAllQuestionSets>;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-10 border-b border-white/[0.08] pb-10 text-center">
        <h1 className="text-[2.2rem] font-bold leading-[1.05] tracking-tight sm:text-4xl">
          A curated library of interview questions across roles and formats.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400">
          {sets.length}+ question sets covering competency, behavioural, technical, and
          case study formats, with model answers and scoring guidance.
        </p>
      </header>

      <QuestionsClient sets={sets} />

      <div className="mt-14 border-t border-white/[0.07] pt-10 text-center">
        <p className="text-sm text-gray-500">
          Want AI-generated questions tailored to your exact role?{" "}
          <Link
            href="/for-candidates/sign-up"
            className="font-bold text-purple-300 hover:text-purple-200"
          >
            Start free →
          </Link>
        </p>
      </div>
    </div>
  );
}
