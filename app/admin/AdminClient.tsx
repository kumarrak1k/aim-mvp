"use client";

import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  accountType: string; // candidate | corporate | university | unknown
  // Candidate Stripe billing
  candidatePlanId: string | null;
  candidateStatus: string | null;
  candidatePeriodEnd: string | null;
  // Corporate workspace
  companyName: string | null;
  companyRole: string | null;
  companyPlanId: string | null;
  companyPlanStatus: string | null;
  companyPeriodEnd: string | null;
  companyTrialEndsAt: string | null;
  // Timestamps (ISO strings)
  createdAt: string;
  lastSignInAt: string | null;
};

// ── Label / badge helpers ─────────────────────────────────────────────────────

const CANDIDATE_PLAN_LABELS: Record<string, string> = {
  professional_monthly: "Professional",
  professional_annual: "Professional (Annual)",
  advanced_monthly: "Advanced",
  advanced_annual: "Advanced (Annual)",
};

const CORP_PLAN_LABELS: Record<string, string> = {
  team: "Team",
  business: "Business",
};

function getPlanLabel(user: AdminUser): string {
  if (user.accountType === "corporate") {
    if (!user.companyPlanId) return "—";
    return CORP_PLAN_LABELS[user.companyPlanId] ?? user.companyPlanId;
  }
  if (!user.candidatePlanId) return "Free";
  return CANDIDATE_PLAN_LABELS[user.candidatePlanId] ?? user.candidatePlanId;
}

function getStatusLabel(user: AdminUser): string {
  if (user.accountType === "corporate") {
    const s = user.companyPlanStatus ?? "none";
    const labels: Record<string, string> = {
      active: "Active",
      trial: "Trial",
      expired: "Expired",
      cancelled: "Cancelled",
      none: "No plan",
    };
    return labels[s] ?? s;
  }
  const s = user.candidateStatus;
  if (!s || s === "none") return "Free";
  const labels: Record<string, string> = {
    active: "Active",
    trialing: "Trialing",
    past_due: "Past due",
    canceled: "Cancelled",
    cancelled: "Cancelled",
    incomplete: "Incomplete",
    unpaid: "Unpaid",
  };
  return labels[s] ?? s;
}

function getStatusGroup(user: AdminUser): "paid" | "trial" | "free" | "expired" {
  if (user.accountType === "corporate") {
    const s = user.companyPlanStatus ?? "none";
    if (s === "active") return "paid";
    if (s === "trial") return "trial";
    if (s === "expired" || s === "cancelled") return "expired";
    return "free";
  }
  const s = user.candidateStatus;
  if (s === "active" || s === "trialing") return "paid";
  if (s === "past_due") return "paid";
  if (s === "canceled" || s === "cancelled") return "expired";
  return "free";
}

function getPeriodEnd(user: AdminUser): string | null {
  if (user.accountType === "corporate") {
    return user.companyTrialEndsAt ?? user.companyPeriodEnd ?? null;
  }
  return user.candidatePeriodEnd ?? null;
}

// ── Badge components ──────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, string> = {
  candidate: "bg-violet-500/20 text-violet-300 border-violet-400/25",
  corporate: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/25",
  university: "bg-blue-500/20 text-blue-300 border-blue-400/25",
  unknown: "bg-white/10 text-gray-400 border-white/10",
};

const STATUS_BADGE: Record<string, string> = {
  paid: "bg-emerald-500/20 text-emerald-300 border-emerald-400/25",
  trial: "bg-cyan-500/20 text-cyan-300 border-cyan-400/25",
  free: "bg-white/[0.07] text-gray-400 border-white/10",
  expired: "bg-red-500/20 text-red-300 border-red-400/25",
};

function TypeBadge({ type }: { type: string }) {
  const cls = TYPE_BADGE[type] ?? TYPE_BADGE.unknown;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-black capitalize ${cls}`}>
      {type}
    </span>
  );
}

function StatusBadge({ user }: { user: AdminUser }) {
  const group = getStatusGroup(user);
  const cls = STATUS_BADGE[group];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-black ${cls}`}>
      {getStatusLabel(user)}
    </span>
  );
}

// ── CSV export ────────────────────────────────────────────────────────────────

function exportCsv(users: AdminUser[]) {
  const headers = [
    "ID", "First name", "Last name", "Email", "Account type",
    "Plan", "Status", "Company", "Company role",
    "Period / trial end", "Joined", "Last active",
  ];

  const rows = users.map((u) => [
    u.id,
    u.firstName ?? "",
    u.lastName ?? "",
    u.email,
    u.accountType,
    getPlanLabel(u),
    getStatusLabel(u),
    u.companyName ?? "",
    u.companyRole ?? "",
    getPeriodEnd(u) ? new Date(getPeriodEnd(u)!).toLocaleDateString("en-GB") : "",
    new Date(u.createdAt).toLocaleDateString("en-GB"),
    u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString("en-GB") : "Never",
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Utility ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fullName(u: AdminUser): string {
  const parts = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return parts || "—";
}

function initials(u: AdminUser): string {
  return [u.firstName?.[0], u.lastName?.[0]].filter(Boolean).join("").toUpperCase() || u.email[0].toUpperCase();
}

const PAGE_SIZE = 50;

type SortKey = "name" | "email" | "type" | "joined" | "lastSeen";
type SortDir = "asc" | "desc";

// ── Main component ────────────────────────────────────────────────────────────

export function AdminClient({ users }: { users: AdminUser[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);

  function copyId(id: string) {
    void navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const candidates = users.filter((u) => u.accountType === "candidate");
    const corporate = users.filter((u) => u.accountType === "corporate");
    const paidCandidates = candidates.filter((u) => u.candidateStatus === "active" || u.candidateStatus === "trialing");
    const activeCorporate = corporate.filter((u) => u.companyPlanStatus === "active" || u.companyPlanStatus === "trial");
    return { total: users.length, candidates: candidates.length, corporate: corporate.length, paidCandidates: paidCandidates.length, activeCorporate: activeCorporate.length };
  }, [users]);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (q) {
        const name = fullName(u).toLowerCase();
        if (!name.includes(q) && !u.email.toLowerCase().includes(q) && !(u.companyName ?? "").toLowerCase().includes(q)) return false;
      }
      if (typeFilter !== "all" && u.accountType !== typeFilter) return false;
      if (statusFilter !== "all" && getStatusGroup(u) !== statusFilter) return false;
      return true;
    });
  }, [users, search, typeFilter, statusFilter]);

  // ── Sorting ───────────────────────────────────────────────────────────────

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va = "", vb = "";
      if (sortKey === "name") { va = fullName(a); vb = fullName(b); }
      else if (sortKey === "email") { va = a.email; vb = b.email; }
      else if (sortKey === "type") { va = a.accountType; vb = b.accountType; }
      else if (sortKey === "joined") { va = a.createdAt; vb = b.createdAt; }
      else if (sortKey === "lastSeen") { va = a.lastSignInAt ?? ""; vb = b.lastSignInAt ?? ""; }
      const cmp = va.localeCompare(vb);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // ── Pagination ────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="ml-1 text-gray-600">↕</span>;
    return <span className="ml-1 text-fuchsia-400">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const thClass = "pb-3 text-left text-xs font-black uppercase tracking-[0.14em] text-gray-500 cursor-pointer select-none hover:text-gray-300 transition whitespace-nowrap";
  const thStaticClass = "pb-3 text-left text-xs font-black uppercase tracking-[0.14em] text-gray-500 whitespace-nowrap";

  return (
    <div className="min-h-screen bg-[#0b0918] px-4 py-10 text-white sm:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-[-0.05em]">Admin</h1>
            <span className="rounded-full border border-red-400/30 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-black text-red-300">
              Internal only
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            AI Career Mentor · User management · {stats.total} total accounts
          </p>
        </div>
        <button
          onClick={() => exportCsv(sorted)}
          className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.09]"
        >
          ↓ Export CSV ({sorted.length})
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: "Total users", value: stats.total, color: "text-white" },
          { label: "Candidates", value: stats.candidates, color: "text-violet-300" },
          { label: "Paid candidates", value: stats.paidCandidates, color: "text-emerald-300" },
          { label: "Corporate accounts", value: stats.corporate, color: "text-fuchsia-300" },
          { label: "Active workspaces", value: stats.activeCorporate, color: "text-cyan-300" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold text-gray-500">{label}</p>
            <p className={`mt-1 text-3xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Search name, email or company…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-fuchsia-400/40 focus:outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-2xl border border-white/10 bg-[#0b0918] px-4 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none"
        >
          <option value="all">All types</option>
          <option value="candidate">Candidate</option>
          <option value="corporate">Corporate</option>
          <option value="university">University</option>
          <option value="unknown">Unknown</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-2xl border border-white/10 bg-[#0b0918] px-4 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid / active</option>
          <option value="trial">Trial</option>
          <option value="free">Free</option>
          <option value="expired">Expired / cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[1.5rem] border border-white/10 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead className="border-b border-white/[0.08]">
            <tr>
              <th className={thClass} onClick={() => toggleSort("name")} style={{ paddingLeft: "1.5rem", paddingRight: "1rem" }}>
                User <SortIcon k="name" />
              </th>
              <th className={thClass} onClick={() => toggleSort("type")}>
                Type <SortIcon k="type" />
              </th>
              <th className={thStaticClass}>Plan</th>
              <th className={thStaticClass}>Status</th>
              <th className={thStaticClass}>Company</th>
              <th className={thStaticClass}>Period end</th>
              <th className={thClass} onClick={() => toggleSort("joined")}>
                Joined <SortIcon k="joined" />
              </th>
              <th className={thClass} onClick={() => toggleSort("lastSeen")}>
                Last active <SortIcon k="lastSeen" />
              </th>
              <th className={thStaticClass} style={{ paddingRight: "1.5rem" }}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {pageData.length === 0 && (
              <tr>
                <td colSpan={9} className="py-16 text-center text-gray-500">
                  No users match your filters.
                </td>
              </tr>
            )}
            {pageData.map((u) => {
              const periodEnd = getPeriodEnd(u);
              return (
                <tr key={u.id} className="group transition hover:bg-white/[0.03]">
                  {/* User */}
                  <td className="py-3.5 pl-6 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/20 text-xs font-black text-fuchsia-300">
                        {initials(u)}
                      </div>
                      <div>
                        <p className="font-bold text-white leading-tight">{fullName(u)}</p>
                        <p className="text-[11px] text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Type */}
                  <td className="py-3.5 pr-4">
                    <TypeBadge type={u.accountType} />
                  </td>
                  {/* Plan */}
                  <td className="py-3.5 pr-4 text-gray-300 whitespace-nowrap">
                    {getPlanLabel(u)}
                  </td>
                  {/* Status */}
                  <td className="py-3.5 pr-4">
                    <StatusBadge user={u} />
                  </td>
                  {/* Company */}
                  <td className="py-3.5 pr-4 text-gray-400 whitespace-nowrap">
                    {u.companyName ?? "—"}
                    {u.companyRole && (
                      <span className="ml-1 text-[10px] text-gray-600 capitalize">({u.companyRole})</span>
                    )}
                  </td>
                  {/* Period end */}
                  <td className="py-3.5 pr-4 text-gray-400 whitespace-nowrap text-[12px]">
                    {periodEnd ? fmtDate(periodEnd) : "—"}
                  </td>
                  {/* Joined */}
                  <td className="py-3.5 pr-4 text-gray-400 whitespace-nowrap text-[12px]">
                    {fmtDate(u.createdAt)}
                  </td>
                  {/* Last active */}
                  <td className="py-3.5 pr-4 text-gray-400 whitespace-nowrap text-[12px]">
                    {fmtDate(u.lastSignInAt)}
                  </td>
                  {/* Actions */}
                  <td className="py-3.5 pr-6">
                    <button
                      onClick={() => copyId(u.id)}
                      title="Copy Clerk user ID"
                      className="rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1 text-[11px] font-black text-gray-500 transition hover:border-white/20 hover:text-gray-300"
                    >
                      {copied === u.id ? "Copied!" : "Copy ID"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-black text-white transition hover:bg-white/[0.09] disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="flex items-center px-3 text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-black text-white transition hover:bg-white/[0.09] disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="mt-10 text-center text-[11px] text-gray-700">
        AI Career Mentor · Internal admin · Not indexed · Not linked from any public page
      </p>
    </div>
  );
}
