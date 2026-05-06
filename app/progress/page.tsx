"use client";

import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MarketingShell } from "../components/marketing/MarketingShell";

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
  topImprovement: string;
};

const emptyCategoryAverages: Required<CategoryBreakdown> = {
  content: 0,
  clarity: 0,
  relevance: 0,
  structure: 0,
  confidence: 0,
  pace: 0,
  voice_delivery: 0,
  camera_presence: 0,
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
  topImprovement: "Complete a session to unlock personalised focus areas.",
};

const categoryLabels: Array<{
  key: keyof Required<CategoryBreakdown>;
  label: string;
}> = [
  { key: "content", label: "Content" },
  { key: "clarity", label: "Clarity" },
  { key: "relevance", label: "Relevance" },
  { key: "structure", label: "Structure" },
  { key: "confidence", label: "Confidence" },
  { key: "pace", label: "Pace" },
  { key: "voice_delivery", label: "Voice" },
  { key: "camera_presence", label: "Camera" },
];

export default function ProgressPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [sessions, setSessions] = useState<DashboardSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");

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

  const stats = useMemo<ProgressStats>(() => {
    if (!sessions.length) return emptyStats;

    const totalScore = sessions.reduce(
      (sum, session) => sum + session.overallScore,
      0
    );

    const latestSession = sessions[0] || null;
    const previousSession = sessions[1] || null;
    const categoryAverages = buildCategoryAverages(sessions);
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
      topImprovement,
    };
  }, [sessions]);

  return (
    <MarketingShell currentPath="/progress">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.065] p-5 shadow-2xl shadow-purple-950/20 backdrop-blur-2xl sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />

          <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
                Track progress
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                See whether your interview performance is{" "}
                <span className="bg-gradient-to-r from-purple-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
                  actually improving.
                </span>
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-8 text-gray-300 sm:text-lg">
                Your completed practice sessions are saved securely and turned
                into a clear improvement dashboard: score trends, readiness
                signal, category strengths and your next focus area.
              </p>
            </div>

            <div className="rounded-[1.65rem] border border-white/10 bg-black/25 p-4">
              <p className="text-sm font-black text-white">Product memory</p>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                AI Career Mentor now remembers completed sessions server-side, so this page
                becomes more useful every time you practise.
              </p>

              <Link href="/practice">
                <button className="mt-4 w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3.5 text-sm font-black text-white shadow-2xl shadow-purple-900/30 transition hover:scale-[1.01]">
                  Start new practice session
                </button>
              </Link>
            </div>
          </div>
        </section>

        {!isLoaded && <ProgressLoadingState />}

        {isLoaded && !isSignedIn && <SignedOutState />}

        {isLoaded && isSignedIn && sessionsLoading && <ProgressLoadingState />}

        {isLoaded && isSignedIn && sessionsError && (
          <ErrorState message={sessionsError} />
        )}

        {isLoaded &&
          isSignedIn &&
          !sessionsLoading &&
          !sessionsError &&
          !stats.latestSession && <EmptyProgressState />}

        {isLoaded &&
          isSignedIn &&
          !sessionsLoading &&
          !sessionsError &&
          stats.latestSession && <ProgressDashboard stats={stats} />}
      </main>
    </MarketingShell>
  );
}

function ProgressDashboard({ stats }: { stats: ProgressStats }) {
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
            description="Each bar is one completed five-question interview, ordered oldest to newest."
          />

          <div className="mt-6 flex h-[320px] items-end gap-3 rounded-[1.6rem] border border-white/10 bg-black/25 p-5">
            {stats.trendSessions.map((session, index) => (
              <div
                key={session.id}
                className="group flex h-full flex-1 flex-col justify-end gap-3"
              >
                <div className="relative flex h-full items-end">
                  <div
                    className="w-full min-w-[18px] rounded-t-2xl bg-gradient-to-t from-purple-600 via-fuchsia-400 to-cyan-300 shadow-[0_0_28px_rgba(168,85,247,0.3)] transition group-hover:scale-[1.02]"
                    style={{
                      height: `${Math.max(8, session.overallScore * 10)}%`,
                    }}
                    title={`${session.overallScore}/10`}
                  />
                </div>

                <div className="text-center">
                  <p className="text-xs font-black text-white">
                    {session.overallScore}
                  </p>
                  <p className="mt-1 text-[10px] font-bold text-gray-500">
                    S{index + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
                  <span className="text-6xl font-black tracking-[-0.08em] text-white">
                    {latest.overallScore}
                  </span>
                  <span className="mb-2 text-lg font-black text-gray-500">
                    /10
                  </span>
                </div>
              </div>

              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">
                {latest.hireSignal}
              </span>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-6 text-gray-300">
              <p>
                <span className="font-black text-white">Role:</span>{" "}
                {latest.role}
              </p>
              <p>
                <span className="font-black text-white">Setup:</span>{" "}
                {latest.interviewType} · {latest.difficulty} · Focus:{" "}
                {latest.focusArea}
              </p>
              <p>
                <span className="font-black text-white">Date:</span>{" "}
                {formatSessionDate(latest.createdAt)}
              </p>
            </div>

            <Link href={`/progress/${latest.id}`}>
              <button className="mt-5 w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15">
                Review full session
              </button>
            </Link>
          </div>

          <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">
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
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        </GlassPanel>
      </div>
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
      <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-[-0.045em] text-white">
        {value}
      </p>
      <p className="mt-2 text-xs font-semibold leading-5 text-gray-500">
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
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-white">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
    </div>
  );
}

function CategoryLine({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(0, Math.min(10, Math.round(value * 10) / 10));
  const width = safeValue * 10;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-white">{label}</p>
        <p className="text-sm font-black text-gray-300">{safeValue}/10</p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-cyan-300 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function SessionRow({ session }: { session: DashboardSession }) {
  return (
    <Link href={`/progress/${session.id}`} className="block">
      <div className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-black/25 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055] sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-black text-cyan-100">
              {session.practiceMode}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-black text-gray-300">
              {session.hireSignal}
            </span>
          </div>

          <p className="truncate text-sm font-black text-white">
            {session.role}
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {session.interviewType} · {session.difficulty} ·{" "}
            {formatSessionDate(session.createdAt)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-center">
          <p className="text-2xl font-black tracking-[-0.04em] text-white">
            {session.overallScore}
          </p>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
            /10
          </p>
        </div>
      </div>
    </Link>
  );
}

function SignedOutState() {
  return (
    <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-300">
        Sign in required
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white">
        Track your interview progress across saved sessions.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300">
        Sign in to save your practice history, view score trends and build a
        clearer improvement path.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <SignInButton mode="modal">
          <button className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-black transition hover:bg-purple-100">
            Sign in to track progress
          </button>
        </SignInButton>

        <Link href="/practice">
          <button className="rounded-2xl border border-purple-300/20 bg-purple-300/10 px-6 py-4 text-sm font-black text-purple-100 transition hover:bg-purple-300/15">
            Try a practice session
          </button>
        </Link>
      </div>
    </section>
  );
}

function EmptyProgressState() {
  return (
    <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
        No sessions yet
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white">
        Complete your first tracked interview.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300">
        Once you finish a five-question session, AI Career Mentor will save your score,
        summary and feedback signals here.
      </p>

      <Link href="/practice">
        <button className="mt-6 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/30 transition hover:scale-[1.01]">
          Start tracked interview
        </button>
      </Link>
    </section>
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
      <p className="text-sm font-black text-amber-100">
        Progress could not load
      </p>
      <p className="mt-2 text-sm leading-7 text-gray-300">{message}</p>
    </section>
  );
}

function buildCategoryAverages(
  sessions: DashboardSession[]
): Required<CategoryBreakdown> {
  const totals = { ...emptyCategoryAverages };
  const counts = { ...emptyCategoryAverages };

  sessions.forEach((session) => {
    const breakdown = session.summary?.category_breakdown;
    if (!breakdown) return;

    categoryLabels.forEach((item) => {
      const value = breakdown[item.key];

      if (typeof value === "number" && Number.isFinite(value)) {
        totals[item.key] += value;
        counts[item.key] += 1;
      }
    });
  });

  return categoryLabels.reduce((accumulator, item) => {
    const count = counts[item.key];
    accumulator[item.key] =
      count > 0 ? Math.round((totals[item.key] / count) * 10) / 10 : 0;
    return accumulator;
  }, { ...emptyCategoryAverages });
}

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