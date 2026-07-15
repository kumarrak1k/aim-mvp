import type { Metadata } from "next";
import Link from "next/link";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
import { createPageMetadata } from "@/app/config/seo";

export const metadata: Metadata = createPageMetadata({
  path: "/guide",
  title: "How to Use AI Career Mentor: Step-by-Step Candidate Guide",
  description:
    "Six quick steps from signing in to interview-ready: build your profile, run tailored practice sessions, read your AI feedback, and track your progress.",
});

type Step = {
  title: string;
  points: string[];
  cta?: { label: string; href: string };
  grad: string;
  tip?: string;
};

const STEPS: Step[] = [
  {
    title: "Build your candidate profile",
    points: [
      "Paste or upload your CV and set your target role, industry and experience level.",
      "Every practice question is generated from this profile, so richer detail means sharper questions.",
      "You only do this once: every session reuses it automatically.",
    ],
    cta: { label: "Open My Profile", href: "/profile" },
    grad: "from-purple-400 to-fuchsia-500",
  },
  {
    title: "Set up your first practice session",
    points: [
      "Choose the interview type (competency is the default), difficulty and focus area.",
      "Pick how you want to answer: typed, voice, or voice + camera for full delivery coaching.",
      "Allow microphone and camera access when your browser asks: it is remembered for next time.",
    ],
    cta: { label: "Start practising", href: "/practice" },
    grad: "from-fuchsia-400 to-pink-500",
    tip: "Voice + camera gives you the complete 360° score: what you say, how you sound, and how you come across.",
  },
  {
    title: "Answer like it's the real thing",
    points: [
      "Each question is read aloud, then your microphone starts listening. Speak naturally.",
      "Structure answers with STAR: Situation, Task, Action, Result.",
      "You can edit the transcript before requesting feedback, or type your answer instead.",
    ],
    grad: "from-pink-400 to-rose-500",
  },
  {
    title: "Read your feedback properly",
    points: [
      "Every answer is scored across six dimensions with specific, honest coaching notes.",
      "A model answer shows the STAR structure applied to your exact question: study the gap.",
      "Voice delivery (pace, fillers, confidence) and camera presence are scored alongside content.",
    ],
    grad: "from-rose-400 to-orange-400",
    tip: "The model answers train the habit: apply the same STAR structure to your own stories each time.",
  },
  {
    title: "Track your progress",
    points: [
      "Every completed session is saved with scores, transcripts and feedback.",
      "Watch your readiness trend and category strengths build over time.",
      "Review any past session in full, or export it as a PDF report.",
    ],
    cta: { label: "Open My Progress", href: "/progress" },
    grad: "from-amber-300 to-yellow-400",
  },
  {
    title: "Go further when you're ready",
    points: [
      "Run a full mock assessment centre: case study, interview and presentation, scored end to end.",
      "Generate a tailored CV enhancement, personal statement or cover letter in Career Docs.",
      "After each session you get a 7-day improvement plan: follow it between practices.",
    ],
    cta: { label: "Explore the Assessment Centre", href: "/assessment-centre" },
    grad: "from-emerald-300 to-cyan-400",
  },
];

export default function CandidateGuidePage() {
  return (
    <CandidateAppShell currentPath="/guide">
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">
        {/* Hero */}
        <div className="mb-12 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-purple-300">
            User guide
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Interview-ready in{" "}
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              six steps.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400">
            Everything on this page takes under two minutes to set up. Follow
            the steps in order the first time; after that, it is just practise,
            review, improve.
          </p>
        </div>

        {/* Timeline */}
        <ol className="relative space-y-6 before:absolute before:bottom-6 before:left-[22px] before:top-6 before:w-px before:bg-gradient-to-b before:from-purple-500/60 before:via-fuchsia-500/40 before:to-cyan-400/40 sm:before:left-[26px]">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative pl-14 sm:pl-16">
              {/* Number badge */}
              <span
                className={`absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${step.grad} text-lg font-black text-black shadow-lg sm:h-[52px] sm:w-[52px] sm:text-xl`}
              >
                {i + 1}
              </span>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-purple-950/10 backdrop-blur-xl sm:p-6">
                <h2 className="text-lg font-black tracking-[-0.02em] text-white sm:text-xl">
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
                    <span className="font-black uppercase tracking-wide text-cyan-300">Tip </span>
                    {step.tip}
                  </p>
                )}
                {step.cta && (
                  <Link
                    href={step.cta.href}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-4 py-2 text-[13px] font-black text-white transition hover:bg-white/[0.14]"
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
        <div className="mt-14 rounded-[1.75rem] border border-purple-400/20 bg-gradient-to-br from-purple-600/20 via-fuchsia-600/10 to-transparent p-8 text-center">
          <h2 className="text-2xl font-black tracking-[-0.03em]">Ready when you are.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
            The fastest way to learn the platform is to run one practice
            session end to end. It takes about ten minutes.
          </p>
          <Link
            href="/practice"
            className="mt-5 inline-block rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-8 py-3 text-sm font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02]"
          >
            Start a practice session
          </Link>
        </div>
      </div>
    </CandidateAppShell>
  );
}
