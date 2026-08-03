import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY_GUIDES } from "./data";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";

export const metadata: Metadata = {
  title: { absolute: "Company Interview Guides | AI Career Mentor" },
  description:
    "In-depth interview guides for McKinsey, Deloitte, Goldman Sachs, KPMG, Civil Service Fast Stream, and more. Process breakdowns, sample questions, and insider tips.",
};

export default function CompaniesIndexPage() {
  return (
    <CandidateShell currentPath="/companies">
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Company Interview Guides
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-400">
            Process breakdowns, sample questions, insider tips, and AI-powered mock
            interview practice, tailored to each employer.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {COMPANY_GUIDES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/companies/${guide.slug}`}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition hover:border-purple-400/30 hover:bg-white/[0.06]"
            >
              <p className="text-xs font-black uppercase tracking-[0.14em] text-purple-400">
                {guide.sector}
              </p>
              <h2 className="mt-2 text-xl font-black tracking-[-0.02em] group-hover:text-purple-100">
                {guide.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">{guide.tagline}</p>
              <p className="mt-4 text-xs font-black text-purple-400 group-hover:text-purple-300">
                Read guide →
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center text-sm text-gray-500">
          More company guides coming soon. Want us to cover a specific employer?{" "}
          <a href="mailto:support@aicareermentor.co.uk" className="text-purple-400 hover:text-purple-300">
            Let us know →
          </a>
        </div>
      </div>
    </CandidateShell>
  );
}
