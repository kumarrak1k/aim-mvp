import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";

export const metadata: Metadata = createPageMetadata({
  path: "/for-candidates/assessment-centre",
  title: "Mock Assessment Centre — AI-Powered Practice for Candidates",
  description:
    "Practise the full assessment centre experience: case study analysis, competency interview, presentation simulation. AI scoring across every competency.",
  keywords: [
    "mock assessment centre",
    "assessment centre practice",
    "case study practice",
    "presentation practice",
    "graduate assessment centre",
    "AI assessment centre coaching",
  ],
});

const stages = [
  {
    label: "Stage 1",
    title: "Case study analysis",
    duration: "~12 minutes",
    text: "Read a realistic business scenario, then write a structured response under a timer. Tests how you analyse, prioritise and communicate under pressure.",
    bullets: [
      "Industry-specific scenarios",
      "Timed response window",
      "Structure and reasoning scored",
    ],
    accent: "purple",
  },
  {
    label: "Stage 2",
    title: "Competency interview",
    duration: "~15 minutes",
    text: "Five tailored competency questions with natural audio. Voice delivery, camera presence and answer quality all scored — same engine as the interview practice product.",
    bullets: [
      "Tailored to your role and level",
      "Voice and camera presence reviewed",
      "Model answer per question",
    ],
    accent: "fuchsia",
  },
  {
    label: "Stage 3",
    title: "Presentation simulation",
    duration: "~5 minutes",
    text: "Given a brief, record a 3-minute spoken presentation. The AI assesses structure, persuasion, pace and presence — the same things a real assessor watches for.",
    bullets: [
      "Realistic 3-minute time pressure",
      "Spoken delivery scored",
      "Structure and persuasion feedback",
    ],
    accent: "cyan",
  },
];

const why = [
  {
    title: "Built like the real thing",
    text: "Real assessment centres test multiple skills under time pressure. Single-question practice can't simulate that. This can.",
  },
  {
    title: "Multi-axis scoring report",
    text: "Get a single rolled-up readiness score plus a per-stage and per-competency breakdown — exactly what an assessor produces.",
  },
  {
    title: "Run it before the real one",
    text: "Use it the week before. The pattern of your weaknesses across all three stages becomes clear, and you have time to fix them.",
  },
  {
    title: "Repeat with new scenarios",
    text: "Different case study each time. Different presentation brief. Practice doesn't get stale.",
  },
];

export default function AssessmentCentrePage() {
  return (
    <AudienceShell
      audience="candidate"
      currentPath="/for-candidates/assessment-centre"
    >
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-14 pt-12 text-center sm:px-6 sm:pb-16 sm:pt-16">
        <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
          NEW · Mock assessment centre
        </p>
        <h1 className="text-[2.4rem] font-black leading-[1.04] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
          The first AI platform that runs a{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-purple-200 to-fuchsia-200 bg-clip-text text-transparent">
            full assessment centre experience.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-9">
          Case study, competency interview, presentation. Three stages, one
          structured session, scored across every competency the way a real
          assessor would.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/for-candidates/sign-up">
            <button className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 px-8 py-4 text-base font-black text-white shadow-2xl shadow-cyan-900/40 transition hover:scale-[1.02] sm:w-auto">
              Try the assessment centre →
            </button>
          </Link>
          <Link href="/for-candidates/interview-practice">
            <button className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-base font-black text-white transition hover:bg-white/[0.08] sm:w-auto">
              Just want interview practice?
            </button>
          </Link>
        </div>
      </section>

      {/* Three stages */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-cyan-300/90">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            One session. Three stages. Full report.
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {stages.map((stage) => (
            <article
              key={stage.label}
              className={`relative overflow-hidden rounded-[1.85rem] border p-7 ${
                stage.accent === "purple"
                  ? "border-purple-500/[0.18] bg-purple-500/[0.05]"
                  : stage.accent === "fuchsia"
                    ? "border-fuchsia-500/[0.18] bg-fuchsia-500/[0.05]"
                    : "border-cyan-500/[0.18] bg-cyan-500/[0.05]"
              }`}
            >
              <p
                className={`text-[11px] font-black uppercase tracking-[0.22em] ${
                  stage.accent === "purple"
                    ? "text-purple-300/90"
                    : stage.accent === "fuchsia"
                      ? "text-fuchsia-300/90"
                      : "text-cyan-300/90"
                }`}
              >
                {stage.label} · {stage.duration}
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                {stage.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-gray-300">
                {stage.text}
              </p>
              <ul className="mt-5 space-y-2 text-sm text-gray-300">
                {stage.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5">
                    <span
                      className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${
                        stage.accent === "purple"
                          ? "bg-purple-400"
                          : stage.accent === "fuchsia"
                            ? "bg-fuchsia-400"
                            : "bg-cyan-400"
                      }`}
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-cyan-300/90">
            Why it matters
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            Practice that actually mirrors the real thing.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {why.map((w) => (
            <div
              key={w.title}
              className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-6"
            >
              <p className="font-black text-white">{w.title}</p>
              <p className="mt-2 text-sm leading-6 text-gray-400">{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="rounded-[2rem] border border-white/[0.1] bg-gradient-to-br from-cyan-500/[0.10] via-purple-500/[0.06] to-transparent p-10 text-center sm:p-14">
          <h2 className="mx-auto max-w-2xl text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            Walk into your assessment centre fully prepared.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400">
            Free to start. Repeat with new scenarios as often as you need.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/for-candidates/sign-up">
              <button className="rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 px-7 py-4 text-base font-black text-white shadow-2xl shadow-cyan-900/40 transition hover:scale-[1.02]">
                Start free →
              </button>
            </Link>
            <Link href="/for-candidates/pricing">
              <button className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-7 py-4 text-base font-black text-white transition hover:bg-white/[0.08]">
                See pricing
              </button>
            </Link>
          </div>
          <p className="mt-5 text-xs text-gray-500">
            Mock assessment centre v1 launches with three stages. Group exercise
            and in-tray simulations on the way.
          </p>
        </div>
      </section>
    </AudienceShell>
  );
}
