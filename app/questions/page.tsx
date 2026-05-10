import type { Metadata } from "next";
import Link from "next/link";
import { getAllQuestionSets } from "@/app/lib/content";
import { absoluteUrl } from "@/app/config/site";
import { PublicShell } from "@/app/components/marketing/PublicShell";

export const metadata: Metadata = {
  title: "Interview Question Library | AI Career Mentor",
  description:
    "Thousands of categorised interview questions by role, industry, and interview type — with model answers and scoring guidance.",
  alternates: { canonical: absoluteUrl("/questions") },
};

const categories = [
  "Product Management",
  "Software Engineering",
  "Finance",
  "Consulting",
  "Marketing",
  "Operations",
  "Data & Analytics",
  "Design",
  "HR & People",
  "Sales",
];

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
            Competency, behavioural, technical, and case study questions —
            with model answers and scoring guidance.
          </p>
        </header>

        {/* Category filter */}
        <div className="mb-10 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-gray-400"
            >
              {cat}
            </span>
          ))}
        </div>

        {sets.length === 0 ? (
          <p className="text-gray-500">Question sets coming soon.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sets.map((set) => (
              <Link key={set.slug} href={`/questions/${set.slug}`}>
                <article className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition hover:border-purple-300/20 hover:bg-purple-300/[0.05]">
                  {set.category && (
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-purple-300/60">
                      {set.category}
                    </p>
                  )}
                  <h2 className="font-black leading-tight transition group-hover:text-purple-200">
                    {set.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {set.description}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-purple-300 opacity-0 transition group-hover:opacity-100">
                    Read questions →
                  </p>
                </article>
              </Link>
            ))}
          </div>
        )}

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
