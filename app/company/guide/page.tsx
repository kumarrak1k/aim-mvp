import type { Metadata } from "next";
import Link from "next/link";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";

export const metadata: Metadata = {
  title: "How to Run Assessments: Step-by-Step Guide | AI Career Mentor",
  robots: "noindex, nofollow",
};

type Step = {
  title: string;
  points: string[];
  cta?: { label: string; href: string };
  grad: string;
  tip?: string;
};

const STEPS: Step[] = [
  {
    title: "Your workspace is your hiring hub",
    points: [
      "Everything lives under your company workspace: templates, invited candidates and scored results.",
      "Colleagues you add as recruiters see the same shared workspace.",
      "The dashboard shows live counts of invites sent, in progress and completed.",
    ],
    cta: { label: "Open the dashboard", href: "/company/dashboard" },
    grad: "from-purple-400 to-fuchsia-500",
  },
  {
    title: "Build an assessment template",
    points: [
      "Define the role, interview type, difficulty and how many questions to ask.",
      "Mix question styles (competency, technical, situational) to mirror your real process.",
      "Add custom instructions or a competency framework and the AI scores against it.",
    ],
    cta: { label: "Create a template", href: "/company/templates" },
    grad: "from-fuchsia-400 to-pink-500",
    tip: "One template can be reused for every candidate applying to the same role, so results are directly comparable.",
  },
  {
    title: "Invite candidates",
    points: [
      "Send email invites from the Candidates page: each candidate gets a secure one-click link.",
      "Candidates complete the assessment online in their own time, with voice and camera if you chose them.",
      "Track who has started, finished, or not yet opened their invite.",
    ],
    cta: { label: "Invite candidates", href: "/company/candidates" },
    grad: "from-pink-400 to-rose-500",
  },
  {
    title: "Review scored, ranked results",
    points: [
      "Completed assessments appear ranked by overall score, with hire signals at a glance.",
      "Open any candidate for the full scorecard: per-question answers, category breakdown and transcripts.",
      "Voice delivery and camera presence scores sit alongside answer quality.",
    ],
    cta: { label: "View results", href: "/company/results" },
    grad: "from-rose-400 to-orange-400",
  },
  {
    title: "Compare fairly, decide faster",
    points: [
      "Every candidate answered the same questions and was scored on the same rubric.",
      "Use category breakdowns to compare strengths, not just totals.",
      "The AI recommendation is an input to your decision, not a replacement for it.",
    ],
    grad: "from-amber-300 to-yellow-400",
  },
  {
    title: "Manage your plan and team",
    points: [
      "Add recruiter seats and monitor candidate invite limits from the plan page.",
      "Trials include 10 candidate invites so you can evaluate with real candidates.",
      "Upgrade, downgrade or manage billing at any time; changes to cheaper plans apply at period end.",
    ],
    cta: { label: "Manage plan", href: "/company/plan" },
    grad: "from-emerald-300 to-cyan-400",
  },
];

export default function CorporateGuidePage() {
  return (
    <CorporateAppShell currentPath="/company/guide">
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">
        {/* Hero */}
        <div className="mb-12 text-center">
          <p className="text-[11px] font-bold tracking-wide text-fuchsia-300">
            User guide
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-4xl">
            From template to shortlist in{" "}
            <span className="text-violet-300">
              six steps.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400">
            Set up once, then every candidate gets the same structured,
            fairly scored assessment. Here is the whole workflow.
          </p>
        </div>

        {/* Timeline */}
        <ol className="relative space-y-6 before:absolute before:bottom-6 before:left-[22px] before:top-6 before:w-px before:bg-gradient-to-b before:from-fuchsia-500/60 before:via-purple-500/40 before:to-cyan-400/40 sm:before:left-[26px]">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative pl-14 sm:pl-16">
              <span
                className={`absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${step.grad} text-lg font-bold text-black shadow-lg sm:h-[52px] sm:w-[52px] sm:text-xl`}
              >
                {i + 1}
              </span>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-purple-950/10 backdrop-blur-xl sm:p-6">
                <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                  {step.title}
                </h2>
                <ul className="mt-3 space-y-2">
                  {step.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-sm leading-6 text-gray-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400/80" />
                      {point}
                    </li>
                  ))}
                </ul>
                {step.tip && (
                  <p className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] px-3.5 py-2.5 text-[13px] leading-5 text-cyan-100">
                    <span className="font-bold uppercase tracking-wide text-cyan-300">Tip </span>
                    {step.tip}
                  </p>
                )}
                {step.cta && (
                  <Link
                    href={step.cta.href}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-white/[0.14]"
                  >
                    {step.cta.label}
                    <span aria-hidden>→</span>
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>

        {/* Closing CTA */}
        <div className="mt-14 rounded-[1.75rem] border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-600/20 via-purple-600/10 to-transparent p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Run your first assessment.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
            Build a template for a live role and invite one real candidate.
            You will have a scored result the same day.
          </p>
          <Link
            href="/company/templates"
            className="mt-5 inline-block rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02]"
          >
            Create a template
          </Link>
        </div>
      </div>
    </CorporateAppShell>
  );
}
