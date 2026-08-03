"use client";

import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";

type PlanInfo = {
  planName: string;
  isActive: boolean;
};

const stages = [
  {
    label: "Stage 1",
    title: "Case study analysis",
    duration: "~12 min",
    description: "Read a real business scenario and write a structured response under a timer.",
    color: "purple",
  },
  {
    label: "Stage 2",
    title: "Competency interview",
    duration: "~15 min",
    description: "Five tailored questions with voice and camera scoring, using the same engine as interview practice.",
    color: "fuchsia",
  },
  {
    label: "Stage 3",
    title: "Presentation simulation",
    duration: "~5 min",
    description: "Record a 3-minute spoken presentation. Scored on structure, persuasion, pace and presence.",
    color: "cyan",
  },
];

function StageCard({ stage }: { stage: typeof stages[number] }) {
  const colors = {
    purple: {
      border: "border-purple-500/[0.18]",
      bg: "bg-purple-500/[0.05]",
      text: "text-purple-300/90",
      dot: "bg-purple-400",
    },
    fuchsia: {
      border: "border-fuchsia-500/[0.18]",
      bg: "bg-fuchsia-500/[0.05]",
      text: "text-fuchsia-300/90",
      dot: "bg-fuchsia-400",
    },
    cyan: {
      border: "border-cyan-500/[0.18]",
      bg: "bg-cyan-500/[0.05]",
      text: "text-cyan-300/90",
      dot: "bg-cyan-400",
    },
  }[stage.color] ?? { border: "", bg: "", text: "", dot: "" };

  return (
    <div className={`rounded-[1.85rem] border p-6 ${colors.border} ${colors.bg}`}>
      <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${colors.text}`}>
        {stage.label} · {stage.duration}
      </p>
      <h3 className="mt-2 text-lg font-black tracking-[-0.03em] text-white">
        {stage.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-gray-300">{stage.description}</p>
    </div>
  );
}

// ─── Upgrade gate (wrong plan) ────────────────────────────────────────────────

function UpgradeGate({ planName }: { planName: string }) {
  const isProfessional = planName === "Plus";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      {/* Header */}
      <section className="relative mb-8 overflow-hidden rounded-[2.25rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.09] via-purple-500/[0.06] to-transparent p-8 text-center shadow-2xl shadow-purple-950/20 backdrop-blur-2xl sm:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative">
          <p className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
            Professional plan · Assessment centre
          </p>
          <h1 className="text-3xl font-black leading-[1.04] tracking-[-0.05em] text-white sm:text-4xl lg:text-5xl">
            Simulate the full assessment centre experience.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-300">
            Case study, competency interview, and presentation: three stages, one session,
            scored the way a real assessor would score you.
          </p>

          <div className="mt-8 inline-flex flex-col items-center gap-2">
            <span className="rounded-full border border-amber-400/30 bg-amber-400/[0.08] px-4 py-1.5 text-xs font-black text-amber-300">
              {isProfessional
                ? "Your Plus plan includes interview practice. Upgrade to Professional to unlock the assessment centre."
                : "This feature requires the Professional plan."}
            </span>
          </div>
        </div>
      </section>

      {/* Stages preview */}
      <section className="mb-8">
        <p className="mb-5 text-center text-[11px] font-black uppercase tracking-[0.26em] text-cyan-300/90">
          What&apos;s included
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {stages.map((s) => <StageCard key={s.label} stage={s} />)}
        </div>
      </section>

      {/* Upgrade CTA */}
      <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-8 text-center">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-white">
          Unlock the assessment centre
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-400">
          Upgrade to the Professional plan to run unlimited mock assessment centre sessions
          with new scenarios each time.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/pricing"
            className="rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 px-8 py-4 text-center text-sm font-black text-white shadow-2xl shadow-cyan-900/40 transition hover:scale-[1.02]"
          >
            Upgrade to Professional →
          </Link>
          <Link
            href="/mock-assessment-centre"
            className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-center text-sm font-black text-white transition hover:bg-white/[0.07]"
          >
            See what&apos;s included
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          Already upgraded?{" "}
          <button onClick={() => window.location.reload()} className="text-cyan-400 underline hover:text-cyan-300">
            Refresh this page
          </button>{" "}
          to activate access.
        </p>
      </section>
    </div>
  );
}

// ─── Sign-in gate ─────────────────────────────────────────────────────────────

function SignInGate() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.09] via-purple-500/[0.06] to-transparent p-8 text-center shadow-2xl shadow-purple-950/20 backdrop-blur-2xl sm:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative">
          <p className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
            Professional plan · Assessment centre
          </p>
          <h1 className="text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
            The full mock assessment centre experience.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-300">
            Case study, competency interview, and presentation, all in one session,
            scored the way a real assessor would.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/for-candidates/sign-up"
              className="rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 px-8 py-4 text-center text-sm font-black text-white shadow-2xl shadow-cyan-900/40 transition hover:scale-[1.02]"
            >
              Get started →
            </Link>
            <SignInButton mode="modal">
              <button className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-sm font-black text-white transition hover:bg-white/[0.07]">
                Sign in
              </button>
            </SignInButton>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {stages.map((s) => <StageCard key={s.label} stage={s} />)}
      </section>
    </div>
  );
}

// ─── Assessment centre access (right plan) ────────────────────────────────────

function AssessmentCentreAccess() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      {/* Hero */}
      <section className="relative mb-8 overflow-hidden rounded-[2.25rem] border border-cyan-300/20 bg-white/[0.055] p-8 text-center shadow-2xl shadow-purple-950/20 backdrop-blur-2xl sm:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100">
            Professional · Unlocked
          </div>
          <h1 className="text-3xl font-black leading-[1.04] tracking-[-0.05em] text-white sm:text-4xl lg:text-5xl">
            Mock assessment centre
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-300">
            Run a full three-stage session: case study, competency interview, and
            presentation. One structured report at the end.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/assessment-centre/setup"
              className="rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 px-8 py-4 text-center text-base font-black text-white shadow-2xl shadow-cyan-900/40 transition hover:scale-[1.02]"
            >
              Start assessment centre →
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Each session uses a fresh scenario. Approximately 45–60 minutes.
          </p>
        </div>
      </section>

      {/* Stages */}
      <section className="mb-8">
        <p className="mb-5 text-center text-[11px] font-black uppercase tracking-[0.26em] text-cyan-300/90">
          Your session
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {stages.map((s) => <StageCard key={s.label} stage={s} />)}
        </div>
      </section>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AssessmentCentrePage() {
  const { isLoaded, isSignedIn } = useUser();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;
    setPlanLoading(true);

    fetch("/api/subscription")
      .then((r) => r.json())
      .then((data: PlanInfo) => {
        if (!cancelled) setPlan(data);
      })
      .catch(() => {
        if (!cancelled) setPlan({ planName: "Free", isActive: false });
      })
      .finally(() => {
        if (!cancelled) setPlanLoading(false);
      });

    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn]);

  const isAdvanced = plan?.planName === "Professional" && plan.isActive;

  function renderContent() {
    if (!isLoaded || planLoading) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
          <p className="text-sm text-gray-500">Checking your plan…</p>
        </div>
      );
    }

    if (!isSignedIn) return <SignInGate />;
    if (isAdvanced) return <AssessmentCentreAccess />;
    return <UpgradeGate planName={plan?.planName ?? "Free"} />;
  }

  return (
    <CandidateAppShell currentPath="/assessment-centre">
      {renderContent()}
    </CandidateAppShell>
  );
}
