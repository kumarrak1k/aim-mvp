import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";

export const metadata: Metadata = createPageMetadata({
  path: "/mock-assessment-centre",
  title: "Mock Assessment Centre: AI-Powered Practice for Candidates",
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
    text: "Five tailored competency questions with natural audio. Voice delivery, camera presence and answer quality all scored. Same engine as the interview practice product.",
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
    text: "Given a brief, record a 3-minute spoken presentation. The AI assesses structure, persuasion, pace and presence, the same things a real assessor watches for.",
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
    text: "Get a single rolled-up readiness score plus a per-stage and per-competency breakdown, exactly what an assessor produces.",
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

const faqs = [
  {
    q: "What is a mock assessment centre?",
    a: "A structured simulation of the full assessment centre format: a timed case study, a competency interview, and a presentation exercise, all scored in one session. It follows the multi-stage structure commonly found in graduate and professional assessment centres across consulting, finance, law, and the public sector.",
  },
  {
    q: "How long does a session take?",
    a: "Approximately 45–60 minutes for the full three-stage session: case study analysis (~12 minutes), a five-question competency interview (~20 minutes), and a three-minute spoken presentation.",
  },
  {
    q: "Who uses assessment centres?",
    a: "Assessment centres are widely used across consulting, finance, law, the public sector, and competitive graduate programmes. If you are applying to a large employer or a structured graduate scheme, there is a high probability you will face one.",
  },
  {
    q: "What competencies does it score?",
    a: "Your performance is scored across multiple competencies including leadership, analytical thinking, communication, teamwork, and commercial awareness, with specific scores and improvement steps for each.",
  },
  {
    q: "Is it free?",
    a: "The mock assessment centre is part of the Professional plan (£29/month), with unlimited runs and fresh scenarios. Interview practice itself is free to start, and Plus (£19/month) adds unlimited voice and camera practice.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default async function AssessmentCentrePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    <CandidateShell currentPath="/mock-assessment-centre">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-14 pt-6 text-center sm:px-6 sm:pb-16 sm:pt-10">
        <h1 className="text-3xl font-bold leading-[1.04] tracking-tight sm:text-4xl">
          The first AI platform that runs a{" "}
          <span className="text-violet-300">
            full assessment centre experience.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-9">
          Case study, competency interview, presentation. Three stages, one
          structured session, scored across every competency the way a real
          assessor would.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/pricing"
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 px-8 py-4 text-center text-base font-bold text-white shadow-2xl shadow-cyan-900/40 transition hover:scale-[1.02] sm:w-auto"
          >
            Get Professional →
          </Link>
          <Link
            href="/interview-practice"
            className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-center text-base font-bold text-white transition hover:bg-white/[0.08] sm:w-auto"
          >
            Just want interview practice?
          </Link>
        </div>
      </section>

      {/* Three stages */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-bold tracking-wide text-cyan-300/90">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            One session. Three stages. Full report.
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {stages.map((stage) => (
            <article
              key={stage.label}
              className={`relative flex flex-col overflow-hidden rounded-[1.85rem] border p-7 ${
                stage.accent === "purple"
                  ? "border-purple-500/[0.18] bg-purple-500/[0.05]"
                  : stage.accent === "fuchsia"
                    ? "border-fuchsia-500/[0.18] bg-fuchsia-500/[0.05]"
                    : "border-cyan-500/[0.18] bg-cyan-500/[0.05]"
              }`}
            >
              <p
                className={`text-[11px] font-bold tracking-wide ${
                  stage.accent === "purple"
                    ? "text-purple-300/90"
                    : stage.accent === "fuchsia"
                      ? "text-fuchsia-300/90"
                      : "text-cyan-300/90"
                }`}
              >
                {stage.label} · {stage.duration}
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">
                {stage.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-gray-300">
                {stage.text}
              </p>
              <ul className="mt-auto space-y-2 pt-5 text-sm text-gray-300">
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
          <p className="text-[11px] font-bold tracking-wide text-cyan-300/90">
            Why it matters
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Practice that actually mirrors the real thing.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {why.map((w) => (
            <div
              key={w.title}
              className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-6"
            >
              <p className="font-bold text-white">{w.title}</p>
              <p className="mt-2 text-sm leading-6 text-gray-400">{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 sm:pb-20">
        <h2 className="mb-8 text-2xl font-bold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-white/[0.07]">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-bold text-white">
                {faq.q}
                <span className="mt-0.5 shrink-0 text-gray-500 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-gray-400">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="rounded-[2rem] border border-white/[0.1] bg-gradient-to-br from-cyan-500/[0.10] via-purple-500/[0.06] to-transparent p-10 text-center sm:p-14">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Walk into your assessment centre fully prepared.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400">
            Included in the Professional plan. Repeat with new scenarios as often as you need.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/pricing"
              className="rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 px-7 py-4 text-center text-base font-bold text-white shadow-2xl shadow-cyan-900/40 transition hover:scale-[1.02]"
            >
              Get Professional →
            </Link>
            <Link
              href="/for-candidates/sign-up"
              className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-7 py-4 text-center text-base font-bold text-white transition hover:bg-white/[0.08]"
            >
              Start free trial
            </Link>
          </div>
          <p className="mt-5 text-xs text-gray-500">
            Mock assessment centre v1 launches with three stages. Group exercise
            and in-tray simulations on the way.
          </p>
        </div>
      </section>
    </CandidateShell>
    </>
  );
}
