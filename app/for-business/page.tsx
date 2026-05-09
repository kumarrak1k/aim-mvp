import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";

export const metadata: Metadata = createPageMetadata({
  path: "/for-business",
  title: "AI Assessment Platform for Recruiters & Talent Teams",
  description:
    "Run structured AI assessments at scale. Build assessment templates for any role, send invite links, score candidates fairly. UK GDPR-ready.",
  keywords: [
    "AI assessment platform",
    "candidate screening",
    "AI hiring assessment",
    "structured interview platform",
    "talent assessment software",
    "AI recruitment platform",
  ],
});

const features = [
  {
    icon: "📋",
    title: "Custom assessment templates",
    text: "Build a structured AI interview for any role — competency, technical, situational, behavioural. Reusable across every candidate for that role.",
  },
  {
    icon: "🔗",
    title: "Email invite links",
    text: "One click sends a candidate a branded invite. They take the assessment on their own time — no scheduling needed, no recruiter time spent.",
  },
  {
    icon: "📊",
    title: "Recruiter results dashboard",
    text: "Every completed assessment scored on a 0-10 scale across competencies, with full transcripts, voice delivery and camera presence. Sort and rank candidates side-by-side.",
  },
  {
    icon: "🎯",
    title: "Fair, comparable scoring",
    text: "The same brief is used for every candidate. AI feedback is generated from your template — not the candidate's CV — so scoring is consistent.",
  },
  {
    icon: "🎨",
    title: "Your branding",
    text: "Candidates see your company name, logo and brand colour at every step. The platform stays in the background.",
  },
  {
    icon: "🔒",
    title: "UK GDPR & DPA-ready",
    text: "UK data residency. Data Processing Agreement available. Candidates control their own data and can delete it any time.",
  },
];

const useCases = [
  {
    title: "Volume hiring",
    text: "Replace or augment first-round phone screens with a consistent AI assessment. 10× the throughput, fairer evaluation, less recruiter time wasted on weak candidates.",
  },
  {
    title: "Graduate &amp; entry-level",
    text: "Run early-careers assessment exercises at scale. Every applicant gets a fair shot at the same brief — no batching, no rota juggling.",
  },
  {
    title: "Specialist roles",
    text: "Build a competency framework specific to the role — leadership, technical depth, stakeholder management — and the AI scores against it consistently.",
  },
  {
    title: "Internal mobility",
    text: "Same framework for promotion or lateral move assessments. Take the bias out, give every internal candidate the same brief.",
  },
];

const stats = [
  { value: "1×", label: "Same brief for every candidate" },
  { value: "0", label: "Recruiter time on weak applicants" },
  { value: "100%", label: "Audit trail per candidate" },
  { value: "GDPR", label: "UK-ready by default" },
];

export default function ForBusinessPage() {
  return (
    <AudienceShell audience="business" currentPath="/for-business">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 text-center sm:px-6 sm:pb-20 sm:pt-16 lg:pt-20">
        <p className="mx-auto mb-6 inline-flex items-center gap-2.5 rounded-full border border-fuchsia-400/25 bg-fuchsia-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-200">
          For hiring teams
        </p>

        <h1 className="mx-auto max-w-5xl text-[2.7rem] font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-[4rem] xl:text-[4.5rem]">
          Run structured AI assessments{" "}
          <span className="bg-gradient-to-r from-fuchsia-200 via-pink-200 to-orange-200 bg-clip-text text-transparent">
            at scale.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg sm:leading-9">
          The recruiter platform candidates trust. Build your own assessment
          templates, send invite links, review structured scoring across every
          applicant — all in one workspace.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/for-business/sign-up">
            <button className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-8 py-4 text-base font-black text-white shadow-2xl shadow-fuchsia-900/40 transition hover:scale-[1.02] sm:w-auto">
              Create workspace →
            </button>
          </Link>
          <Link href="/for-business/assessment-platform">
            <button className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-base font-black text-white transition hover:bg-white/[0.08] sm:w-auto">
              See how it works
            </button>
          </Link>
        </div>

        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/[0.09] bg-white/[0.04] px-2 py-3 text-center"
            >
              <p className="text-xl font-black tracking-[-0.04em] sm:text-2xl">
                {s.value}
              </p>
              <p className="mt-1 text-[9px] leading-4 text-gray-500 sm:text-[10px]">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300/90">
            Platform
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            Everything a hiring team needs to assess at scale.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-6 transition hover:border-white/[0.12] hover:bg-white/[0.05]"
            >
              <div className="mb-3 text-2xl">{f.icon}</div>
              <p className="font-black text-white">{f.title}</p>
              <p className="mt-2 text-sm leading-6 text-gray-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300/90">
            Use cases
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            Built for the hiring problems that matter.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {useCases.map((uc) => (
            <div
              key={uc.title}
              className="rounded-[1.75rem] border border-fuchsia-500/[0.15] bg-fuchsia-500/[0.04] p-7"
            >
              <h3
                className="text-xl font-black tracking-[-0.035em]"
                dangerouslySetInnerHTML={{ __html: uc.title }}
              />
              <p
                className="mt-3 text-sm leading-7 text-gray-300"
                dangerouslySetInnerHTML={{ __html: uc.text }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="rounded-[2rem] border border-white/[0.1] bg-gradient-to-br from-fuchsia-500/[0.10] via-purple-500/[0.06] to-transparent p-10 text-center sm:p-14">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300/90">
            Get started
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            Hire fairly. Hire faster. Hire with structure.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400">
            Create your workspace and send your first invite in under 10 minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/for-business/sign-up">
              <button className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-8 py-4 text-base font-black text-white shadow-2xl shadow-fuchsia-900/40 transition hover:scale-[1.02] sm:w-auto">
                Create workspace →
              </button>
            </Link>
            <Link href="/for-business/sign-in">
              <button className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-base font-black text-white transition hover:bg-white/[0.08] sm:w-auto">
                Already have a workspace
              </button>
            </Link>
          </div>
        </div>
      </section>
    </AudienceShell>
  );
}
