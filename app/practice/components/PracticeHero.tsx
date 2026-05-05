"use client";

import Link from "next/link";
import { MiniStat } from "./PracticeUi";

type PracticeHeroProps = {
  totalQuestions: number;
  canStartInterview: boolean;
  questionLoading: boolean;
  setupSummary: string;
  onStartInterview: () => void;
};

export function PracticeHero({
  totalQuestions,
  canStartInterview,
  questionLoading,
  setupSummary,
  onStartInterview,
}: PracticeHeroProps) {
  return (
    <div className="relative mb-6 w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:mb-8 sm:rounded-[2.25rem] sm:p-6 md:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />

      <div className="relative grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.72fr)] lg:items-stretch">
        <div className="flex min-w-0 flex-col">
          <div className="mb-5 flex max-w-full items-center gap-3 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-xs font-black text-purple-50 shadow-xl shadow-purple-950/20 sm:inline-flex sm:text-sm">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </span>
            <span className="min-w-0 break-words leading-5 sm:truncate">
              Personalised AI mock interview and delivery coach
            </span>
          </div>

          <h1 className="max-w-full break-words text-[2.55rem] font-black leading-[1.02] tracking-[-0.055em] text-white sm:text-4xl md:text-5xl lg:text-6xl">
            Practise the full interview signal:{" "}
            <span className="bg-gradient-to-r from-purple-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              answers, voice and presence.
            </span>
          </h1>

          <p className="mt-5 max-w-full break-words text-base leading-7 text-gray-300 md:text-lg md:leading-8">
            Run a focused five-question mock interview tailored to your target
            role. Get strict hiring-bar feedback, natural question audio,
            voice-delivery analysis, camera-presence scoring and stronger model
            answers.
          </p>

          <div className="mt-6 w-full rounded-[1.35rem] border border-cyan-300/15 bg-cyan-300/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              Current default setup
            </p>
            <p className="mt-2 max-w-full break-words text-sm font-semibold leading-6 text-gray-200">
              {setupSummary}
            </p>
          </div>

          <div className="mt-6 grid w-full gap-3 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={onStartInterview}
              disabled={!canStartInterview || questionLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6"
            >
              {questionLoading
                ? "Starting..."
                : `Start tailored ${totalQuestions}-question interview`}
            </button>

            <a href="#interview-setup" className="block w-full sm:w-auto">
              <button className="w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 sm:w-auto sm:px-6">
                Adjust setup
              </button>
            </a>

            <Link href="/profile" className="block w-full sm:w-auto">
              <button className="w-full rounded-2xl border border-purple-300/20 bg-purple-300/10 px-5 py-4 text-sm font-black text-purple-100 transition hover:bg-purple-300/15 sm:w-auto sm:px-6">
                Add CV / role profile
              </button>
            </Link>
          </div>

          {!canStartInterview && (
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Add or load a target role first, then this top button will start
              the interview instantly.
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-col rounded-[1.8rem] border border-white/10 bg-black/25 p-4 shadow-2xl shadow-black/20">
          <div className="mb-4 grid min-w-0 grid-cols-3 gap-3">
            <MiniStat value={String(totalQuestions)} label="Questions" />
            <MiniStat value="360°" label="Feedback" />
            <MiniStat value="8+" label="Target" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
            <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                  Session preview
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  What the coach will assess
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">
                Ready
              </span>
            </div>

            <div className="space-y-3">
              <PreviewMetric
                label="Answer substance"
                value="Content + relevance"
              />
              <PreviewMetric
                label="Delivery"
                value="Pace + fillers + confidence"
              />
              <PreviewMetric
                label="Presence"
                value="Camera + posture + eye contact"
              />
              <PreviewMetric
                label="Improvement"
                value="Model answer + next steps"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-gray-400">
              <HeroPill text="Phone/iPad guided flow" />
              <HeroPill text="STAR coaching" />
              <HeroPill text="Model answers" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroPill({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2">
      ✓ {text}
    </span>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="min-w-0 text-sm font-black text-white">{label}</p>
      <p className="shrink-0 text-right text-xs font-bold leading-5 text-gray-400">
        {value}
      </p>
    </div>
  );
}