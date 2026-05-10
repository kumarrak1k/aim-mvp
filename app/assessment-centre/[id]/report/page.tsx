"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";

type CompetencyScores = {
  analyticalThinking: number;
  communication: number;
  commercialAwareness: number;
  leadership: number;
  problemSolving: number;
};

type StageScores = {
  caseStudy: number;
  interview: number;
  presentation: number;
};

type Report = {
  overallScore: number;
  readinessLevel: string;
  headline: string;
  competencyScores: CompetencyScores;
  stageScores: StageScores;
  topStrengths: string[];
  priorityImprovements: string[];
  sevenDayPlan: string[];
  finalRecommendation: string;
};

type Session = {
  id: string;
  status: string;
  role: string;
  sector: string;
  experienceLevel: string;
  createdAt: string;
  overallScore: number | null;
  report: Report | null;
};

function CompetencyBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 10) * 100;
  const colour =
    score >= 7 ? "from-emerald-400 to-emerald-500" :
    score >= 5 ? "from-amber-400 to-amber-500" :
    "from-red-400 to-red-500";

  return (
    <div className="flex items-center gap-4">
      <span className="w-48 text-sm text-gray-300 shrink-0">{label}</span>
      <div className="relative flex-1 h-2.5 rounded-full bg-white/[0.07]">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${colour} transition-all duration-1000`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm font-black text-white">{score}</span>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const colour =
    score >= 7 ? "text-emerald-400" :
    score >= 5 ? "text-amber-400" :
    "text-red-400";

  const ringColour =
    score >= 7 ? "border-emerald-400/50 shadow-emerald-900/30" :
    score >= 5 ? "border-amber-400/50 shadow-amber-900/30" :
    "border-red-400/50 shadow-red-900/30";

  return (
    <div className={`relative mx-auto flex h-36 w-36 items-center justify-center rounded-full border-4 ${ringColour} shadow-2xl`}>
      <div className="text-center">
        <div className={`text-5xl font-black ${colour}`}>{score.toFixed(1)}</div>
        <div className="text-xs text-gray-500 font-black">/ 10</div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function fetchSession() {
      fetch(`/api/assessment-centre/${id}`)
        .then((r) => r.json())
        .then((data: Session) => {
          setSession(data);
          if (data.status === "complete") {
            setLoading(false);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        })
        .catch(() => {
          setError("Failed to load your report. Please refresh.");
          setLoading(false);
          if (pollRef.current) clearInterval(pollRef.current);
        });
    }

    fetchSession();
    pollRef.current = setInterval(fetchSession, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  if (error) {
    return (
      <CandidateAppShell currentPath="/assessment-centre">
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-red-400">{error}</p>
        </div>
      </CandidateAppShell>
    );
  }

  if (loading || !session || session.status !== "complete" || !session.report) {
    return (
      <CandidateAppShell currentPath="/assessment-centre">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center px-4">
          <div className="relative">
            <svg className="h-12 w-12 animate-spin text-purple-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Generating your report…</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">
              Our chief assessor AI is synthesising your performance across all three stages.
              This takes 15–30 seconds.
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-purple-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </CandidateAppShell>
    );
  }

  const report = session.report;
  const readinessColour =
    report.readinessLevel === "High"
      ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300"
      : report.readinessLevel === "Moderate"
      ? "border-amber-400/30 bg-amber-400/[0.08] text-amber-300"
      : "border-red-400/30 bg-red-400/[0.08] text-red-300";

  const sessionDate = new Date(session.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <CandidateAppShell currentPath="/assessment-centre">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
        {/* ─── 1. Hero section ─── */}
        <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.04] p-8 backdrop-blur-2xl shadow-2xl sm:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex flex-col items-center gap-6 text-center">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
              Final Assessment Centre Report · {sessionDate}
            </div>

            <ScoreRing score={report.overallScore} />

            <span className={`rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-[0.15em] ${readinessColour}`}>
              {report.readinessLevel} Readiness
            </span>

            <div>
              <div className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 mb-1">
                {session.role} · {session.sector}
              </div>
              <p className="text-lg font-black leading-snug text-white max-w-xl">
                &ldquo;{report.headline}&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* ─── 2. Stage scores ─── */}
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Case Study", score: report.stageScores.caseStudy, colour: "purple", icon: "📋" },
            { label: "Interview", score: report.stageScores.interview, colour: "fuchsia", icon: "🎤" },
            { label: "Presentation", score: report.stageScores.presentation, colour: "cyan", icon: "📊" },
          ].map((stage) => {
            const borderBg =
              stage.colour === "purple"
                ? "border-purple-500/[0.2] bg-purple-500/[0.06]"
                : stage.colour === "fuchsia"
                ? "border-fuchsia-500/[0.2] bg-fuchsia-500/[0.06]"
                : "border-cyan-500/[0.2] bg-cyan-500/[0.06]";
            const textColour =
              stage.colour === "purple"
                ? "text-purple-300"
                : stage.colour === "fuchsia"
                ? "text-fuchsia-300"
                : "text-cyan-300";
            const scoreColour =
              stage.score >= 7 ? "text-emerald-400" : stage.score >= 5 ? "text-amber-400" : "text-red-400";

            return (
              <div key={stage.label} className={`rounded-[1.75rem] border ${borderBg} p-6 text-center backdrop-blur-xl`}>
                <div className="text-3xl mb-2">{stage.icon}</div>
                <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${textColour} mb-2`}>
                  {stage.label}
                </p>
                <div className={`text-4xl font-black ${scoreColour}`}>{stage.score.toFixed(1)}</div>
                <div className="text-xs text-gray-600">/ 10</div>
              </div>
            );
          })}
        </section>

        {/* ─── 3. Competency breakdown ─── */}
        <section className="mb-8 rounded-[2rem] border border-white/[0.08] bg-white/[0.04] p-7 backdrop-blur-xl">
          <h2 className="mb-6 text-[11px] font-black uppercase tracking-[0.26em] text-gray-400">
            Competency breakdown
          </h2>
          <div className="space-y-4">
            <CompetencyBar label="Analytical thinking" score={report.competencyScores.analyticalThinking} />
            <CompetencyBar label="Communication" score={report.competencyScores.communication} />
            <CompetencyBar label="Commercial awareness" score={report.competencyScores.commercialAwareness} />
            <CompetencyBar label="Leadership potential" score={report.competencyScores.leadership} />
            <CompetencyBar label="Problem solving" score={report.competencyScores.problemSolving} />
          </div>
        </section>

        {/* ─── 4. Strengths & Improvements ─── */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-emerald-500/[0.18] bg-emerald-500/[0.04] p-6 backdrop-blur-xl">
            <h2 className="mb-4 text-[11px] font-black uppercase tracking-[0.26em] text-emerald-400">
              Your strengths
            </h2>
            <ul className="space-y-3">
              {report.topStrengths.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-black text-emerald-400">
                    ✓
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[2rem] border border-amber-500/[0.18] bg-amber-500/[0.04] p-6 backdrop-blur-xl">
            <h2 className="mb-4 text-[11px] font-black uppercase tracking-[0.26em] text-amber-400">
              Priority improvements
            </h2>
            <ul className="space-y-3">
              {report.priorityImprovements.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-black text-amber-400">
                    →
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── 5. 7-day action plan ─── */}
        <section className="mb-8 rounded-[2rem] border border-white/[0.08] bg-white/[0.04] p-7 backdrop-blur-xl">
          <h2 className="mb-6 text-[11px] font-black uppercase tracking-[0.26em] text-gray-400">
            Your 7-day action plan
          </h2>
          <div className="space-y-3">
            {report.sevenDayPlan.map((action, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/40 to-cyan-400/30 text-xs font-black text-white">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-300 leading-6">{action}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 6. Final recommendation ─── */}
        <section className="mb-8 rounded-[2rem] border-l-4 border-l-purple-400 border-y border-r border-white/[0.08] bg-white/[0.04] p-7 backdrop-blur-xl">
          <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.26em] text-purple-400">
            Final recommendation
          </h2>
          <p className="text-base leading-8 text-gray-200 italic">
            &ldquo;{report.finalRecommendation}&rdquo;
          </p>
        </section>

        {/* ─── 7. CTAs ─── */}
        <section className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/assessment-centre/setup">
            <button className="rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 px-8 py-4 text-sm font-black text-white shadow-2xl shadow-cyan-900/40 transition hover:scale-[1.02]">
              Retake assessment centre →
            </button>
          </Link>
          <Link href="/practice">
            <button className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-sm font-black text-white transition hover:bg-white/[0.07]">
              Return to interview practice
            </button>
          </Link>
        </section>
      </div>
    </CandidateAppShell>
  );
}
