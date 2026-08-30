"use client";

import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CandidateAppShell } from "../components/marketing/CandidateAppShell";
import {
  buildCategoryAverages,
  categoryLabels,
  emptyCategoryAverages,
} from "./lib/buildCategoryAverages";

// ─── Assessment Centre session type ────────────────────────────────────────
type ACReport = {
  overallScore?: number;
  readinessLevel?: string;
  headline?: string;
  topStrengths?: string[];
  priorityImprovements?: string[];
  competencyScores?: Record<string, number>;
};

type ACSession = {
  id: string;
  role: string;
  sector: string;
  experienceLevel: string;
  selectedStages: string[];
  overallScore: number | null;
  caseStudyScore: number | null;
  interviewScore: number | null;
  presentationScore: number | null;
  report: ACReport | null;
  createdAt: string;
};

type CategoryBreakdown = {
  content?: number;
  clarity?: number;
  relevance?: number;
  structure?: number;
  confidence?: number;
  pace?: number;
  voice_delivery?: number;
  camera_presence?: number;
};

type SessionSummary = {
  overall_score?: number;
  readiness_score?: number;
  hire_signal?: "Weak" | "Moderate" | "Strong";
  category_breakdown?: CategoryBreakdown;
  top_strengths?: string[];
  top_improvements?: string[];
  priority_improvements?: string[];
  final_recommendation?: string;
  next_steps?: string[];
};

type DashboardSession = {
  id: string;
  role: string;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  focusArea: string;
  practiceMode: string;
  totalQuestions: number;
  overallScore: number;
  hireSignal: string;
  summary?: SessionSummary;
  createdAt: string;
};

type ProgressStats = {
  latestSession: DashboardSession | null;
  recentSessions: DashboardSession[];
  trendSessions: DashboardSession[];
  totalSessions: number;
  averageScore: number;
  bestScore: number;
  latestDelta: number | null;
  strongSignals: number;
  categoryAverages: Required<CategoryBreakdown>;
  /** Number of sessions that contributed a non-zero value to each category. */
  categoryDataCounts: Required<CategoryBreakdown>;
  topImprovement: string;
};

const emptyStats: ProgressStats = {
  latestSession: null,
  recentSessions: [],
  trendSessions: [],
  totalSessions: 0,
  averageScore: 0,
  bestScore: 0,
  latestDelta: null,
  strongSignals: 0,
  categoryAverages: emptyCategoryAverages,
  categoryDataCounts: emptyCategoryAverages,
  topImprovement: "Complete a session to unlock personalised focus areas.",
};

export default function ProgressPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState<"practice" | "assessment">("practice");

  // ── Interview practice sessions ────────────────────────────────────────
  const [sessions, setSessions] = useState<DashboardSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  // planName is returned alongside sessions by /api/practice-sessions
  const [planName, setPlanName] = useState<string>("Free");

  // ── Assessment centre sessions ─────────────────────────────────────────
  const [acSessions, setAcSessions] = useState<ACSession[]>([]);
  const [acLoading, setAcLoading] = useState(false);
  const [acError, setAcError] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setSessions([]);
      setSessionsLoading(false);
      setSessionsError("");
      return;
    }

    let cancelled = false;

    const loadSessions = async () => {
      try {
        setSessionsLoading(true);
        setSessionsError("");

        const response = await fetch("/api/practice-sessions", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (cancelled) return;

        if (!response.ok || data.error) {
          setSessions([]);
          setSessionsError(data.error || "Could not load your progress.");
          return;
        }

        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
        if (data.usage?.planName) setPlanName(data.usage.planName as string);
      } catch {
        if (!cancelled) {
          setSessions([]);
          setSessionsError("Could not load your progress yet.");
        }
      } finally {
        if (!cancelled) {
          setSessionsLoading(false);
        }
      }
    };

    void loadSessions();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  // ── Fetch assessment centre sessions ──────────────────────────────────
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setAcSessions([]);
      return;
    }
    let cancelled = false;
    const loadAC = async () => {
      setAcLoading(true);
      setAcError("");
      try {
        const res = await fetch("/api/assessment-centre/sessions");
        const data = await res.json() as { sessions?: ACSession[]; error?: string };
        if (cancelled) return;
        if (!res.ok || data.error) { setAcError(data.error ?? "Could not load results."); return; }
        setAcSessions(Array.isArray(data.sessions) ? data.sessions : []);
      } catch {
        if (!cancelled) setAcError("Could not load assessment centre results.");
      } finally {
        if (!cancelled) setAcLoading(false);
      }
    };
    void loadAC();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn]);

  const stats = useMemo<ProgressStats>(() => {
    if (!sessions.length) return emptyStats;

    const totalScore = sessions.reduce(
      (sum, session) => sum + session.overallScore,
      0
    );

    const latestSession = sessions[0] || null;
    const previousSession = sessions[1] || null;
    const { averages: categoryAverages, counts: categoryDataCounts } = buildCategoryAverages(sessions);
    const improvementCounts = new Map<string, number>();

    sessions.forEach((session) => {
      const improvements =
        session.summary?.priority_improvements ||
        session.summary?.top_improvements ||
        [];

      improvements.forEach((item) => {
        const key = item.trim();
        if (!key) return;
        improvementCounts.set(key, (improvementCounts.get(key) || 0) + 1);
      });
    });

    const topImprovement =
      [...improvementCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
      latestSession?.summary?.top_improvements?.[0] ||
      "Run another session to build a clearer improvement pattern.";

    return {
      latestSession,
      recentSessions: sessions.slice(0, 8),
      trendSessions: sessions.slice(0, 10).reverse(),
      totalSessions: sessions.length,
      averageScore: Math.round((totalScore / sessions.length) * 10) / 10,
      bestScore: Math.max(...sessions.map((session) => session.overallScore)),
      latestDelta:
        latestSession && previousSession
          ? latestSession.overallScore - previousSession.overallScore
          : null,
      strongSignals: sessions.filter(
        (session) => session.hireSignal.toLowerCase() === "strong"
      ).length,
      categoryAverages,
      categoryDataCounts,
      topImprovement,
    };
  }, [sessions]);

  return (
    <CandidateAppShell currentPath="/progress">
      <main className="mx-auto max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] px-4 py-8 sm:px-6 lg:py-10">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.065] p-6 text-center shadow-2xl shadow-purple-950/20 backdrop-blur-2xl sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="relative mx-auto max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-bold tracking-wide text-cyan-100">
              Track progress
            </div>
            <h1 className="text-3xl font-bold leading-[1.02] tracking-tight sm:text-4xl">
              See whether your performance is{" "}
              <span className="text-violet-300">
                actually improving.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-gray-300 sm:text-lg">
              Every completed session is saved and turned into a clear
              improvement dashboard: score trends, readiness signals, category
              strengths and your personalised focus areas.
            </p>
          </div>
        </section>

        {/* ── Tab bar (only when signed in) ──────────────────────────────── */}
        {isLoaded && isSignedIn && (
          <div className="mt-6 flex gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1.5 backdrop-blur-xl">
            <button
              onClick={() => setActiveTab("practice")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                activeTab === "practice"
                  ? "bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-400/25 text-on-accent shadow-sm"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${activeTab === "practice" ? "bg-fuchsia-400" : "bg-gray-600"}`} />
              Interview Practice
              {sessions.length > 0 && (
                <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[12px] font-bold text-gray-400">
                  {sessions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("assessment")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                activeTab === "assessment"
                  ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/25 text-on-accent shadow-sm"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${activeTab === "assessment" ? "bg-cyan-400" : "bg-gray-600"}`} />
              Assessment Centre
              {acSessions.length > 0 && (
                <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[12px] font-bold text-gray-400">
                  {acSessions.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── Not loaded / signed out ────────────────────────────────────── */}
        {!isLoaded && <ProgressLoadingState />}
        {isLoaded && !isSignedIn && <SignedOutState />}

        {/* ── Interview Practice tab ─────────────────────────────────────── */}
        {isLoaded && isSignedIn && activeTab === "practice" && (
          <>
            {sessionsLoading && <ProgressLoadingState />}
            {!sessionsLoading && sessionsError && <ErrorState message={sessionsError} />}
            {!sessionsLoading && !sessionsError && !stats.latestSession && <EmptyProgressState isAdvancedPlan={planName === "Professional"} />}
            {!sessionsLoading && !sessionsError && stats.latestSession && (
              <ProgressDashboard
                stats={stats}
                isAdvancedPlan={planName === "Professional"}
                onSessionDeleted={(id) =>
                  setSessions((prev) => prev.filter((s) => s.id !== id))
                }
              />
            )}
          </>
        )}

        {/* ── Assessment Centre tab ──────────────────────────────────────── */}
        {isLoaded && isSignedIn && activeTab === "assessment" && (
          <>
            {acLoading && <ProgressLoadingState />}
            {!acLoading && acError && <ErrorState message={acError} />}
            {!acLoading && !acError && acSessions.length === 0 && <EmptyACState />}
            {!acLoading && !acError && acSessions.length > 0 && <ACDashboard sessions={acSessions} onSessionDeleted={(id) => setAcSessions((prev) => prev.filter((x) => x.id !== id))} />}
          </>
        )}

      </main>
    </CandidateAppShell>
  );
}

function ProgressDashboard({ stats, isAdvancedPlan, onSessionDeleted }: { stats: ProgressStats; isAdvancedPlan: boolean; onSessionDeleted: (id: string) => void }) {
  const latest = stats.latestSession;
  if (!latest) return null;

  const latestDelta =
    stats.latestDelta === null
      ? "First tracked session"
      : stats.latestDelta > 0
        ? `+${stats.latestDelta} vs previous`
        : stats.latestDelta < 0
          ? `${stats.latestDelta} vs previous`
          : "No change vs previous";

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Latest score"
          value={`${latest.overallScore}/10`}
          detail={latestDelta}
          variant="primary"
        />
        <MetricCard
          label="Average"
          value={`${stats.averageScore}/10`}
          detail={`${stats.totalSessions} tracked sessions`}
        />
        <MetricCard
          label="Best score"
          value={`${stats.bestScore}/10`}
          detail="Highest saved session"
        />
        <MetricCard
          label="Strong signals"
          value={String(stats.strongSignals)}
          detail="Sessions marked Strong"
        />
        <MetricCard
          label="Latest signal"
          value={latest.hireSignal}
          detail={formatSessionDate(latest.createdAt)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <GlassPanel>
          <PanelHeader
            eyebrow="Score trajectory"
            title="Readiness trend"
            description="Each point is one completed interview. The line shows your score over time."
          />
          <TrendChart sessions={stats.trendSessions} />
        </GlassPanel>

        <GlassPanel>
          <PanelHeader
            eyebrow="Current signal"
            title="Latest session"
            description="Your most recent completed interview."
          />

          <div className="mt-6 rounded-[1.6rem] border border-cyan-300/15 bg-cyan-300/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400">Readiness score</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-5xl font-bold tracking-tight text-white">
                    {latest.overallScore}
                  </span>
                  <span className="mb-2 text-lg font-bold text-gray-400">
                    /10
                  </span>
                </div>
              </div>

              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
                {latest.hireSignal}
              </span>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-6 text-gray-300">
              <p>
                <span className="font-bold text-white">Role:</span>{" "}
                {latest.role}
              </p>
              <p>
                <span className="font-bold text-white">Setup:</span>{" "}
                {latest.interviewType} · {latest.difficulty} · Focus:{" "}
                {latest.focusArea}
              </p>
              <p>
                <span className="font-bold text-white">Date:</span>{" "}
                {formatSessionDate(latest.createdAt)}
              </p>
            </div>

            <Link href={`/progress/${latest.id}`}>
              <button className="mt-5 w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/15">
                Review full session
              </button>
            </Link>
          </div>

          <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-bold tracking-wide text-purple-300">
              Next focus
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              {stats.topImprovement}
            </p>
          </div>
        </GlassPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
        <GlassPanel>
          <PanelHeader
            eyebrow="Category average"
            title="Where you are strongest"
            description="Averages are calculated from saved summary category scores."
          />

          <div className="mt-6 space-y-4">
            {categoryLabels.map((item) => (
              <CategoryLine
                key={item.key}
                label={item.label}
                value={stats.categoryAverages[item.key]}
                noData={
                  (item.voiceOnly || item.cameraOnly) &&
                  stats.categoryDataCounts[item.key] === 0
                }
              />
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <PanelHeader
            eyebrow="History"
            title="Recent saved sessions"
            description="Click any saved session to review the full question archive."
          />

          <div className="mt-6 space-y-3">
            {stats.recentSessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onDeleted={onSessionDeleted}
              />
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* Assessment centre section — content differs by plan */}
      <section className="overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.08] via-purple-500/[0.05] to-transparent p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
          <div className="flex-1">
            <p className="mb-2 text-[12px] font-bold tracking-wide text-cyan-300">
              Next level · Mock assessment centre
            </p>
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Interview practice is just the start.
            </h2>
            <p className="mt-3 text-sm leading-7 text-gray-300">
              Most employers now follow interviews with a full assessment centre,
              including a case study, presentation, and more.{" "}
              {isAdvancedPlan
                ? "Simulate the complete format before the real thing. It's included in your plan."
                : "Upgrade to Professional and simulate the complete format before the real thing."}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            {isAdvancedPlan ? (
              <Link href="/assessment-centre">
                <button className="w-full whitespace-nowrap rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-3.5 text-sm font-bold text-on-accent shadow-lg transition hover:scale-[1.02] sm:w-auto lg:w-full">
                  Start mock assessment centre →
                </button>
              </Link>
            ) : (
              <>
                <Link href="/pricing">
                  <button className="w-full whitespace-nowrap rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-3.5 text-sm font-bold text-on-accent shadow-lg transition hover:scale-[1.02] sm:w-auto lg:w-full">
                    Upgrade to Professional →
                  </button>
                </Link>
                <Link href="/mock-assessment-centre">
                  <button className="w-full whitespace-nowrap rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.07] px-6 py-3.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/[0.12] sm:w-auto lg:w-full">
                    See what&apos;s included
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  variant = "default",
}: {
  label: string;
  value: string;
  detail: string;
  variant?: "default" | "primary";
}) {
  return (
    <div
      className={`rounded-[1.55rem] border p-5 shadow-2xl backdrop-blur-2xl ${
        variant === "primary"
          ? "border-cyan-300/20 bg-cyan-300/10 shadow-cyan-950/10"
          : "border-white/10 bg-white/[0.055] shadow-purple-950/10"
      }`}
    >
      <p className="text-xs font-bold tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-2 text-xs font-semibold leading-5 text-gray-400">
        {detail}
      </p>
    </div>
  );
}

function GlassPanel({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:p-6">
      {children}
    </section>
  );
}

function PanelHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold tracking-wide text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
    </div>
  );
}

function CategoryLine({
  label,
  value,
  noData = false,
}: {
  label: string;
  value: number;
  noData?: boolean;
}) {
  const safeValue = Math.max(0, Math.min(10, Math.round(value * 10) / 10));
  const width = safeValue * 10;

  if (noData) {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-gray-400">{label}</p>
          <p className="text-xs font-bold text-gray-400">
            N/A · keyboard only
          </p>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/[0.04]">
          <div className="h-full w-0" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-sm font-bold text-gray-300">{safeValue}/10</p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Delete control for a saved practice session.
 *
 * The DELETE endpoint already existed but had no route through the UI, so a
 * candidate could not remove a session they did not want kept. For a product
 * that stores interview performance, that is a gap worth closing on its own
 * terms as well as a data protection one.
 *
 * Sits outside the row's Link (nested interactive elements inside an anchor
 * are invalid and swallow the click), and confirms before deleting because
 * there is no undo.
 */
function DeleteSessionButton({
  sessionId,
  onDeleted,
  endpoint = "/api/practice-sessions",
}: {
  sessionId: string;
  onDeleted: (id: string) => void;
  /** Collection route the id hangs off. Practice and AC sessions differ. */
  endpoint?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (busy) return;
    if (
      !window.confirm(
        "Delete this saved session? Its scores will be removed from your trend and averages. This cannot be undone."
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${endpoint}/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      onDeleted(sessionId);
    } catch (err) {
      console.error("Session delete failed", err);
      window.alert("Could not delete that session. Please try again.");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      aria-label="Delete this saved session"
      title="Delete this session"
      className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] font-bold text-gray-400 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}

function SessionRow({
  session,
  onDeleted,
}: {
  session: DashboardSession;
  onDeleted: (id: string) => void;
}) {
  return (
    <div className="relative">
      <div className="absolute right-3 top-3 z-10">
        <DeleteSessionButton sessionId={session.id} onDeleted={onDeleted} />
      </div>
    <Link href={`/progress/${session.id}`} className="block">
      <div className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-black/25 p-4 pr-24 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055] sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-[12px] font-bold text-cyan-100">
              {session.practiceMode}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[12px] font-bold text-gray-300">
              {session.hireSignal}
            </span>
          </div>

          <p className="truncate text-sm font-bold text-white">
            {session.role}
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-400">
            {session.interviewType} · {session.difficulty} ·{" "}
            {formatSessionDate(session.createdAt)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-center">
          <p className="text-2xl font-bold tracking-tight text-white">
            {session.overallScore}
          </p>
          <p className="text-[12px] font-bold tracking-wide text-gray-400">
            /10
          </p>
        </div>
      </div>
    </Link>
    </div>
  );
}

function SignedOutState() {
  return (
    <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <p className="text-xs font-bold tracking-wide text-purple-300">
        Sign in required
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
        Track your interview progress across saved sessions.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300">
        Sign in to save your practice history, view score trends and build a
        clearer improvement path.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <SignInButton mode="modal">
          <button className="rounded-2xl bg-white px-6 py-4 text-sm font-bold text-black transition hover:bg-purple-100">
            Sign in to track progress
          </button>
        </SignInButton>

        <Link href="/practice">
          <button className="rounded-2xl border border-purple-300/20 bg-purple-300/10 px-6 py-4 text-sm font-bold text-purple-100 transition hover:bg-purple-300/15">
            Try a practice session
          </button>
        </Link>
      </div>
    </section>
  );
}

function EmptyProgressState({ isAdvancedPlan }: { isAdvancedPlan: boolean }) {
  return (
    <div className="mt-6 space-y-4">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
        <p className="text-xs font-bold tracking-wide text-cyan-300">
          No sessions yet
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
          Complete your first tracked interview.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300">
          Once you finish a five-question session, AI Career Mentor will save your score,
          summary and feedback signals here.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/practice">
            <button className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-sm font-bold text-on-accent shadow-2xl shadow-purple-900/30 transition hover:scale-[1.01]">
              Start tracked interview
            </button>
          </Link>
          <Link href={isAdvancedPlan ? "/assessment-centre" : "/mock-assessment-centre"}>
            <button className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.07] px-6 py-4 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/[0.12]">
              {isAdvancedPlan ? "Try mock assessment centre →" : "Learn about assessment centres →"}
            </button>
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.07] via-purple-500/[0.04] to-transparent p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
        <p className="text-[12px] font-bold tracking-wide text-cyan-300">
          {isAdvancedPlan ? "Your plan · Mock assessment centre" : "Professional · Mock assessment centre"}
        </p>
        <h3 className="mt-2 text-xl font-bold tracking-tight text-white">
          Going for a role with an assessment centre?
        </h3>
        <p className="mt-2 text-sm leading-7 text-gray-300">
          Simulate the full format (case study, interview, and presentation) in one
          session. Assessment centres are a standard stage at most large graduate employers.
        </p>
        {isAdvancedPlan ? (
          <Link href="/assessment-centre">
            <button className="mt-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-3 text-sm font-bold text-on-accent shadow-lg transition hover:scale-[1.02]">
              Start mock assessment centre →
            </button>
          </Link>
        ) : (
          <Link href="/pricing">
            <button className="mt-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-3 text-sm font-bold text-on-accent shadow-lg transition hover:scale-[1.02]">
              Upgrade to Professional →
            </button>
          </Link>
        )}
      </section>
    </div>
  );
}

function ProgressLoadingState() {
  return (
    <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <p className="text-sm leading-7 text-gray-300">
        Loading your progress dashboard...
      </p>
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="mt-6 rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <p className="text-sm font-bold text-amber-100">
        Progress could not load
      </p>
      <p className="mt-2 text-sm leading-7 text-gray-300">{message}</p>
    </section>
  );
}

// ─── Assessment Centre components ───────────────────────────────────────────

function EmptyACState() {
  return (
    <div className="mt-6 space-y-4">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
        <p className="text-xs font-bold tracking-wide text-cyan-300">No results yet</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
          Complete your first Assessment Centre.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300">
          Once you finish a full mock assessment centre session (case study,
          interview, and presentation), your scores and AI report
          will appear here.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/assessment-centre">
            <button className="rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-4 text-sm font-bold text-on-accent shadow-2xl shadow-purple-900/30 transition hover:scale-[1.01]">
              Start assessment centre →
            </button>
          </Link>
          <Link href="/mock-assessment-centre">
            <button className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.07] px-6 py-4 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/[0.12]">
              What&apos;s included
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function ACScoreBar({ label, score, colour = "purple" }: { label: string; score: number | null; colour?: string }) {
  if (score === null) return null;
  const safe = Math.max(0, Math.min(10, score));
  const pct = safe * 10;
  const colMap: Record<string, string> = {
    purple: "from-purple-500 to-fuchsia-400",
    cyan: "from-cyan-400 to-blue-400",
    amber: "from-amber-400 to-orange-400",
    emerald: "from-emerald-400 to-teal-400",
  };
  const gradient = colMap[colour] ?? colMap.purple;
  const textCol =
    safe >= 7 ? "text-emerald-400" : safe >= 5 ? "text-amber-300" : "text-rose-400";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-bold text-white">{label}</span>
        <span className={`text-sm font-bold ${textCol}`}>{safe.toFixed(1)}/10</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} shadow-[0_0_12px_rgba(168,85,247,0.3)]`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ACSessionRow({
  session,
  onDeleted,
}: {
  session: ACSession;
  onDeleted: (id: string) => void;
}) {
  const score = session.overallScore;
  const scoreCol =
    score === null ? "text-gray-400"
    : score >= 7 ? "text-emerald-400"
    : score >= 5 ? "text-amber-300"
    : "text-rose-400";

  const stageLabels: Record<string, string> = {
    stage1: "Case Study",
    stage2: "Interview",
    stage3: "Presentation",
  };

  return (
    <div className="relative">
      <div className="absolute right-3 top-3 z-10">
        <DeleteSessionButton
          sessionId={session.id}
          onDeleted={onDeleted}
          endpoint="/api/assessment-centre"
        />
      </div>
    <Link href={`/assessment-centre/${session.id}/report`} className="block">
      <div className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-black/25 p-4 pr-24 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055] sm:grid-cols-[minmax(0,1fr)_100px] sm:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {session.selectedStages.map((s) => (
              <span key={s} className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-0.5 text-[12px] font-bold text-cyan-200">
                {stageLabels[s] ?? s}
              </span>
            ))}
          </div>
          <p className="truncate text-sm font-bold text-white">{session.role}</p>
          <p className="mt-0.5 text-xs leading-5 text-gray-400">
            {session.sector} · {session.experienceLevel} · {formatSessionDate(session.createdAt)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-center">
          <p className={`text-2xl font-bold tracking-tight ${scoreCol}`}>
            {score !== null ? score.toFixed(1) : "–"}
          </p>
          <p className="text-[12px] font-bold tracking-wide text-gray-400">/10</p>
        </div>
      </div>
    </Link>
    </div>
  );
}

function ACDashboard({ sessions, onSessionDeleted }: { sessions: ACSession[]; onSessionDeleted: (id: string) => void }) {
  const latest = sessions[0];
  const scores = sessions.map((s) => s.overallScore).filter((s): s is number => s !== null);
  const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
  const best = scores.length ? Math.max(...scores) : null;
  const report = latest.report;

  const competencyLabels: Record<string, string> = {
    analyticalThinking: "Analytical Thinking",
    communication: "Communication",
    commercialAwareness: "Commercial Awareness",
    leadership: "Leadership",
    problemSolving: "Problem Solving",
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.55rem] border border-cyan-300/20 bg-cyan-300/10 p-5 shadow-2xl backdrop-blur-2xl">
          <p className="text-xs font-bold tracking-wide text-gray-400">Latest score</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {latest.overallScore !== null ? `${latest.overallScore.toFixed(1)}/10` : "–"}
          </p>
          <p className="mt-2 text-xs font-semibold text-gray-400">{formatSessionDate(latest.createdAt)}</p>
        </div>
        <div className="rounded-[1.55rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur-2xl">
          <p className="text-xs font-bold tracking-wide text-gray-400">Average</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {avg !== null ? `${avg}/10` : "–"}
          </p>
          <p className="mt-2 text-xs font-semibold text-gray-400">{sessions.length} completed session{sessions.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-[1.55rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur-2xl">
          <p className="text-xs font-bold tracking-wide text-gray-400">Best score</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {best !== null ? `${best.toFixed(1)}/10` : "–"}
          </p>
          <p className="mt-2 text-xs font-semibold text-gray-400">Highest session</p>
        </div>
        <div className="rounded-[1.55rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur-2xl">
          <p className="text-xs font-bold tracking-wide text-gray-400">Readiness</p>
          <p className="mt-3 text-xl font-bold tracking-tight text-white">
            {report?.readinessLevel ?? "–"}
          </p>
          <p className="mt-2 text-xs font-semibold text-gray-400">From latest report</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Latest session stage breakdown */}
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:p-6">
          <p className="text-xs font-bold tracking-wide text-cyan-300">Latest session</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Stage breakdown</h2>
          <p className="mt-1 text-sm text-gray-400">{latest.role} · {latest.sector}</p>
          <div className="mt-6 space-y-4">
            {latest.caseStudyScore !== null && (
              <ACScoreBar label="Case Study" score={latest.caseStudyScore} colour="purple" />
            )}
            {latest.interviewScore !== null && (
              <ACScoreBar label="Interview" score={latest.interviewScore} colour="cyan" />
            )}
            {latest.presentationScore !== null && (
              <ACScoreBar label="Presentation" score={latest.presentationScore} colour="amber" />
            )}
            {latest.overallScore !== null && (
              <div className="mt-2 border-t border-white/[0.07] pt-4">
                <ACScoreBar label="Overall" score={latest.overallScore} colour="emerald" />
              </div>
            )}
          </div>
          <Link href={`/assessment-centre/${latest.id}/report`}>
            <button className="mt-6 w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/15">
              View full report →
            </button>
          </Link>
        </section>

        {/* Competency scores or strengths/improvements */}
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:p-6">
          {report?.competencyScores && Object.keys(report.competencyScores).length > 0 ? (
            <>
              <p className="text-xs font-bold tracking-wide text-purple-300">Latest session</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Competency scores</h2>
              <p className="mt-1 text-sm text-gray-400">From the final assessment report</p>
              <div className="mt-6 space-y-4">
                {Object.entries(report.competencyScores).map(([key, val]) => (
                  <ACScoreBar
                    key={key}
                    label={competencyLabels[key] ?? key}
                    score={val}
                    colour="purple"
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-bold tracking-wide text-purple-300">Latest report</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Feedback summary</h2>
              {report?.headline && (
                <p className="mt-3 text-sm leading-7 text-gray-300 italic">&ldquo;{report.headline}&rdquo;</p>
              )}
              {report?.topStrengths && report.topStrengths.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[12px] font-bold tracking-wide text-emerald-400">Strengths</p>
                  <ul className="space-y-1.5">
                    {report.topStrengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="mt-0.5 text-emerald-400">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {report?.priorityImprovements && report.priorityImprovements.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[12px] font-bold tracking-wide text-amber-400">To improve</p>
                  <ul className="space-y-1.5">
                    {report.priorityImprovements.slice(0, 3).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="mt-0.5 text-amber-400">→</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Session history */}
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-bold tracking-wide text-cyan-300">History</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">All completed sessions</h2>
          </div>
          <Link href="/assessment-centre">
            <button className="shrink-0 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-2.5 text-xs font-bold text-on-accent shadow-lg transition hover:scale-[1.02]">
              New session →
            </button>
          </Link>
        </div>
        <div className="space-y-3">
          {sessions.map((s) => (
            <ACSessionRow key={s.id} session={s} onDeleted={onSessionDeleted} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Trend chart ────────────────────────────────────────────────────────────

function TrendChart({ sessions }: { sessions: DashboardSession[] }) {
  if (!sessions.length) return null;

  const VW = 700;
  const VH = 260;
  const padL = 38;
  const padR = 24;
  const padT = 28;
  const padB = 44;
  const cW = VW - padL - padR;
  const cH = VH - padT - padB;

  // Map sessions → SVG coords (score 0 = bottom, 10 = top)
  const pts = sessions.map((s, i) => ({
    x: padL + (sessions.length === 1 ? cW / 2 : (i / (sessions.length - 1)) * cW),
    y: padT + cH - (Math.max(0, Math.min(10, s.overallScore)) / 10) * cH,
    score: s.overallScore,
    idx: i + 1,
  }));

  // Smooth cubic bezier path
  const buildCurve = (p: typeof pts) => {
    if (p.length === 1) return `M ${p[0].x} ${p[0].y}`;
    let d = `M ${p[0].x} ${p[0].y}`;
    for (let i = 1; i < p.length; i++) {
      const dx = (p[i].x - p[i - 1].x) / 2.8;
      d += ` C ${p[i - 1].x + dx} ${p[i - 1].y}, ${p[i].x - dx} ${p[i].y}, ${p[i].x} ${p[i].y}`;
    }
    return d;
  };

  const curve = buildCurve(pts);
  const first = pts[0];
  const last = pts[pts.length - 1];
  const area = `${curve} L ${last.x} ${padT + cH} L ${first.x} ${padT + cH} Z`;

  // Score zone y-positions
  const yAt = (v: number) => padT + cH - (v / 10) * cH;
  const gridLines = [2, 4, 6, 8, 10];
  const targetY = yAt(7);

  return (
    <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/[0.07] bg-black/30">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full"
        style={{ display: "block", height: "260px" }}
        aria-label="Score trend chart"
      >
        <defs>
          {/* Line gradient: purple → fuchsia → cyan */}
          <linearGradient id="tcLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="48%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>

          {/* Area fill: purple → transparent */}
          <linearGradient id="tcArea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.28" />
            <stop offset="75%" stopColor="#a855f7" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>

          {/* Glow filter for the line and dots */}
          <filter id="tcGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Dot glow */}
          <filter id="dotGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip to chart area */}
          <clipPath id="tcClip">
            <rect x={padL} y={padT} width={cW} height={cH} />
          </clipPath>
        </defs>

        {/* Score zone bands */}
        <rect x={padL} y={yAt(7)} width={cW} height={yAt(4) - yAt(7)} fill="rgba(52,211,153,0.03)" />
        <rect x={padL} y={yAt(4)} width={cW} height={yAt(0) - yAt(4)} fill="rgba(248,113,113,0.025)" />

        {/* Grid lines + left axis labels */}
        {gridLines.map((v) => {
          const y = yAt(v);
          return (
            <g key={v}>
              <line
                x1={padL} y1={y} x2={padL + cW} y2={y}
                stroke="rgba(255,255,255,0.055)" strokeWidth="1"
              />
              <text
                x={padL - 7} y={y + 4}
                textAnchor="end" fontSize="11"
                fill="rgba(255,255,255,0.22)" fontWeight="700"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Target line at 7 */}
        <line
          x1={padL} y1={targetY} x2={padL + cW} y2={targetY}
          stroke="rgba(52,211,153,0.35)" strokeWidth="1.2"
          strokeDasharray="5 4"
        />
        <text
          x={padL + cW + 4} y={targetY + 4}
          fontSize="9.5" fill="rgba(52,211,153,0.6)" fontWeight="900"
        >
          TARGET
        </text>

        {/* Area fill (clipped) */}
        <path d={area} fill="url(#tcArea)" clipPath="url(#tcClip)" />

        {/* Main curve */}
        <path
          d={curve}
          fill="none"
          stroke="url(#tcLine)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#tcGlow)"
          clipPath="url(#tcClip)"
        />

        {/* Data points */}
        {pts.map((pt) => {
          const isLatest = pt.idx === pts.length;
          const scoreColor =
            pt.score >= 8 ? "#34d399" : pt.score >= 6 ? "#67e8f9" : pt.score >= 4 ? "#fbbf24" : "#f87171";

          return (
            <g key={pt.idx}>
              {/* Outer pulse ring on latest */}
              {isLatest && (
                <circle cx={pt.x} cy={pt.y} r="14" fill={scoreColor} fillOpacity="0.12" />
              )}
              {/* Halo */}
              <circle cx={pt.x} cy={pt.y} r="9" fill={scoreColor} fillOpacity="0.18" filter="url(#dotGlow)" />
              {/* Core dot */}
              <circle cx={pt.x} cy={pt.y} r="5" fill={scoreColor} filter="url(#dotGlow)" />
              <circle cx={pt.x} cy={pt.y} r="2.5" fill="white" />

              {/* Score label above dot */}
              <text
                x={pt.x} y={pt.y - 16}
                textAnchor="middle" fontSize="12"
                fontWeight="900" fill="white"
              >
                {pt.score}
              </text>

              {/* Session label below chart */}
              <text
                x={pt.x} y={padT + cH + 20}
                textAnchor="middle" fontSize="10.5"
                fontWeight="700" fill="rgba(255,255,255,0.28)"
              >
                S{pt.idx}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Category averages ───────────────────────────────────────────────────────

function formatSessionDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}