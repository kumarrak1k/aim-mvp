import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";

export const metadata: Metadata = createPageMetadata({
  path: "/for-business/assessment-platform",
  title: "AI Assessment Platform: How It Works",
  description:
    "How AI Career Mentor's hiring platform works. Build assessment templates, send invites, score candidates fairly. End-to-end recruiter workflow.",
  keywords: [
    "AI assessment platform",
    "structured interview platform",
    "candidate scoring software",
    "assessment template builder",
  ],
});

const workflow = [
  {
    number: "01",
    title: "Create your workspace",
    text: "Sign up as a hiring team. Name your company, invite team members, set your branding (colour, logo).",
  },
  {
    number: "02",
    title: "Build assessment templates",
    text: "Pick role, level, interview type, difficulty, focus area, question count. Add custom instructions and a competency framework. Reusable across every candidate for that role.",
  },
  {
    number: "03",
    title: "Send branded invites",
    text: "Add a candidate email and click invite. They receive a branded email with a unique link. They take the assessment when they're ready, with no scheduling and no recruiter time.",
  },
  {
    number: "04",
    title: "Review structured results",
    text: "Every completed assessment scored on a 0-10 scale across competencies, with full transcripts, voice and camera analysis. Sort candidates by score, drill into any answer.",
  },
];

const guarantees = [
  {
    title: "Same brief, every candidate",
    text: "The AI generates questions strictly from your template, never from the candidate's CV. Comparable scoring across every applicant.",
  },
  {
    title: "Full audit trail",
    text: "Every question, answer, score and feedback note is saved per candidate. Full transparency, defensible decisions.",
  },
  {
    title: "Candidate experience that respects them",
    text: "Branded with your company. Take it on their own time. Voice or typed answers. Results private to your team and never shown to the candidate.",
  },
  {
    title: "UK GDPR & DPA-ready",
    text: "Data residency in the UK. DPA available on request. Candidates can request deletion any time.",
  },
];

export default function BusinessPlatformPage() {
  return (
    <AudienceShell
      audience="business"
      currentPath="/for-business/assessment-platform"
    >
      <section className="mx-auto max-w-5xl px-4 pb-14 pt-6 text-center sm:px-6 sm:pb-16 sm:pt-10">
        <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-400/[0.07] px-4 py-2 text-[11px] font-bold tracking-wide text-purple-200">
          Platform
        </p>
        <h1 className="text-4xl font-bold leading-[1.04] tracking-tight sm:text-4xl lg:text-5xl">
          From workspace to first hire{" "}
          <span className="text-violet-300">
            in 4 steps.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-9">
          A complete recruiter workflow, from designing your assessment to
          comparing candidates side-by-side.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/for-business/sign-up">
            <button className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02] sm:w-auto">
              Create workspace →
            </button>
          </Link>
          <Link href="/for-business/pricing">
            <button className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-base font-bold text-white transition hover:bg-white/[0.08] sm:w-auto">
              See pricing
            </button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
          {workflow.map((step) => (
            <div
              key={step.number}
              className="rounded-[1.85rem] border border-purple-500/[0.18] bg-purple-500/[0.04] p-7"
            >
              <p className="text-3xl font-bold leading-none text-purple-500/40">
                {step.number}
              </p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-gray-300">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-bold tracking-wide text-purple-300/90">
            What you get
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Built for serious hiring teams.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {guarantees.map((g) => (
            <div
              key={g.title}
              className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-6"
            >
              <p className="font-bold text-white">{g.title}</p>
              <p className="mt-2 text-sm leading-6 text-gray-400">{g.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="rounded-[2rem] border border-white/[0.1] bg-gradient-to-br from-purple-500/[0.10] via-fuchsia-500/[0.06] to-transparent p-10 text-center sm:p-14">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Hire faster, fairer, with structure.
          </h2>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/for-business/sign-up">
              <button className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-7 py-4 text-base font-bold text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02]">
                Create workspace →
              </button>
            </Link>
            <Link href="/for-business/pricing">
              <button className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-7 py-4 text-base font-bold text-white transition hover:bg-white/[0.08]">
                See pricing
              </button>
            </Link>
          </div>
        </div>
      </section>
    </AudienceShell>
  );
}
