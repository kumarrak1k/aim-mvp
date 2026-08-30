"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";

type ResultRow = {
  id: string;
  candidateEmail: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string;
  emailSent: boolean;
  emailSentAt: string | null;
  template: { id: string; name: string; role: string; questionCount: number };
  session: {
    id: string;
    overallScore: number;
    readinessScore: number | null;
    hireSignal: string;
    practiceMode: string;
    totalQuestions: number;
    recommendation: string | null;
    completedAt: string;
  } | null;
};

type ResultStats = {
  total: number;
  completed: number;
  pending: number;
  averageScore: number | null;
  strongCount: number;
};

type SortKey = "completed" | "score" | "candidate" | "template" | "created";
type SortDir = "asc" | "desc";

const STATUS_COLORS: Record<string, string> = {
  pending: "border-yellow-400/25 bg-yellow-400/15 text-yellow-200",
  started: "border-blue-400/25 bg-blue-400/15 text-blue-200",
  completed: "border-green-400/25 bg-green-400/15 text-green-200",
};

const SIGNAL_COLORS: Record<string, string> = {
  Strong: "border-emerald-400/30 bg-emerald-400/15 text-emerald-200",
  Moderate: "border-amber-400/25 bg-amber-400/12 text-amber-200",
  Weak: "border-red-400/25 bg-red-400/12 text-red-200",
};

export default function CompanyResultsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [stats, setStats] = useState<ResultStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("completed");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    async function load() {
      try {
        // Confirm company exists; redirect to setup if not.
        const companyRes = await fetch("/api/company");
        const companyData = await companyRes.json();
        if (!companyData.company) {
          router.push("/company/setup");
          return;
        }

        const res = await fetch("/api/company/results");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load results.");
          return;
        }
        setRows(data.rows || []);
        setStats(data.stats || null);
      } catch {
        setError("Network error loading results.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const templates = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.template.id, r.template.name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const filtered = useMemo(() => {
    const lowered = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "completed" && r.status !== "completed") return false;
      if (filter === "pending" && r.status === "completed") return false;
      if (templateFilter !== "all" && r.template.id !== templateFilter)
        return false;
      if (lowered && !r.candidateEmail.toLowerCase().includes(lowered)) return false;
      return true;
    });
  }, [rows, filter, templateFilter, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "score") {
        const av = a.session?.overallScore ?? -1;
        const bv = b.session?.overallScore ?? -1;
        return (av - bv) * dir;
      }
      if (sortKey === "candidate") {
        return a.candidateEmail.localeCompare(b.candidateEmail) * dir;
      }
      if (sortKey === "template") {
        return a.template.name.localeCompare(b.template.name) * dir;
      }
      if (sortKey === "created") {
        return (
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
          dir
        );
      }
      // completed
      const av = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bv = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return (av - bv) * dir;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "candidate" || key === "template" ? "asc" : "desc");
    }
  }

  if (loading) {
    return (
      <CorporateAppShell currentPath="/company/results">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
        </div>
      </CorporateAppShell>
    );
  }

  return (
    <CorporateAppShell currentPath="/company/results">
      <div className="mx-auto max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wide text-fuchsia-300">
              Assessment results
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              Candidate scoring &amp; review
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Every assessment your team has issued, with full results for completed
              ones. Sort by score to compare candidates or click any row for the
              full transcript and feedback.
            </p>
          </div>
        </div>

        {/* Stats strip */}
        {stats && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatTile label="Total invites" value={String(stats.total)} color="text-fuchsia-300" />
            <StatTile label="Completed" value={String(stats.completed)} color="text-green-300" />
            <StatTile label="Pending" value={String(stats.pending)} color="text-yellow-300" />
            <StatTile
              label="Average score"
              value={stats.averageScore !== null ? `${stats.averageScore}/10` : "–"}
              color="text-cyan-300"
            />
            <StatTile
              label="Strong signal"
              value={String(stats.strongCount)}
              color="text-emerald-300"
            />
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/25 bg-red-400/[0.07] p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Filter bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "completed", "pending"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`rounded-full border px-4 py-2 text-xs font-bold capitalize transition ${
                  filter === opt
                    ? "border-fuchsia-300/50 bg-fuchsia-300/15 text-fuchsia-100"
                    : "border-white/10 bg-white/[0.04] text-gray-400 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                {opt}
              </button>
            ))}
            {templates.length > 0 && (
              <select
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
                className="rounded-full border border-white/10 bg-background px-4 py-2 text-xs font-bold text-white outline-none focus:border-fuchsia-400/40"
              >
                <option value="all">All templates</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <input
            type="search"
            aria-label="Search candidates by email"
            placeholder="Search candidate email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white placeholder-gray-400 outline-none focus:border-fuchsia-400/40 sm:w-72"
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] shadow-xl shadow-black/10">
          {sorted.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-gray-400">
                {rows.length === 0
                  ? "No assessments sent yet. Invite a candidate from the Candidates page."
                  : "No results match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-black/20">
                    <SortHeader
                      label="Candidate"
                      active={sortKey === "candidate"}
                      dir={sortDir}
                      onClick={() => toggleSort("candidate")}
                    />
                    <SortHeader
                      label="Template / Role"
                      active={sortKey === "template"}
                      dir={sortDir}
                      onClick={() => toggleSort("template")}
                    />
                    <th className="px-4 py-3 text-left font-bold text-gray-400">Status</th>
                    <SortHeader
                      label="Score"
                      active={sortKey === "score"}
                      dir={sortDir}
                      onClick={() => toggleSort("score")}
                    />
                    <th className="px-4 py-3 text-left font-bold text-gray-400">Signal</th>
                    <SortHeader
                      label="Completed"
                      active={sortKey === "completed"}
                      dir={sortDir}
                      onClick={() => toggleSort("completed")}
                    />
                    <th className="px-4 py-3 text-right font-bold text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sorted.map((r) => {
                    const expired =
                      r.status !== "completed" &&
                      new Date(r.expiresAt) < new Date();
                    const statusLabel = expired ? "expired" : r.status;
                    const statusClass = expired
                      ? "border-red-400/25 bg-red-400/12 text-red-200"
                      : STATUS_COLORS[r.status] ||
                        "border-white/10 bg-white/[0.05] text-gray-300";

                    return (
                      <tr
                        key={r.id}
                        tabIndex={0}
                        role="button"
                        aria-label={`View results for ${r.candidateEmail}`}
                        className="cursor-pointer transition hover:bg-white/[0.03] focus:outline-none focus-visible:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/60"
                        onClick={() => router.push(`/company/results/${r.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(`/company/results/${r.id}`);
                          }
                        }}
                      >
                        <td className="px-4 py-3 font-semibold text-white">
                          {r.candidateEmail}
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          <div className="font-semibold text-white">
                            {r.template.name}
                          </div>
                          <div className="text-xs text-gray-400">{r.template.role}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {r.session ? (
                            <ScoreCell score={r.session.overallScore} />
                          ) : (
                            <span className="text-xs text-gray-400">–</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.session?.hireSignal ? (
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                                SIGNAL_COLORS[r.session.hireSignal] ||
                                "border-white/10 bg-white/[0.05] text-gray-300"
                              }`}
                            >
                              {r.session.hireSignal}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">–</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {r.completedAt
                            ? new Date(r.completedAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "–"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {r.session ? (
                            <Link
                              href={`/company/results/${r.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-lg border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1.5 text-xs font-bold text-fuchsia-200 transition hover:bg-fuchsia-400/20"
                            >
                              Review →
                            </Link>
                          ) : (
                            <span className="text-xs text-gray-400">Awaiting</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CorporateAppShell>
  );
}

function StatTile({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
      <p className="text-sm font-semibold text-gray-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <th
      scope="col"
      role="button"
      tabIndex={0}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      aria-label={`Sort by ${label}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer select-none px-4 py-3 text-left font-bold transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/60"
    >
      <span
        className={`inline-flex items-center gap-1 ${active ? "text-white" : "text-gray-400"}`}
      >
        {label}
        {active && (
          <span className="text-xs" aria-hidden="true">{dir === "asc" ? "↑" : "↓"}</span>
        )}
      </span>
    </th>
  );
}

function ScoreCell({ score }: { score: number }) {
  const color =
    score >= 8
      ? "text-emerald-300"
      : score >= 6
        ? "text-cyan-300"
        : score >= 4
          ? "text-amber-300"
          : "text-red-300";
  return (
    <span className={`text-base font-bold ${color}`}>
      {score}
      <span className="text-xs text-gray-400">/10</span>
    </span>
  );
}
