"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  accountType: string; // candidate | corporate | university | unknown
  candidatePlanId: string | null;
  candidateStatus: string | null;
  candidatePeriodEnd: string | null;
  companyName: string | null;
  companyRole: string | null;
  companyPlanId: string | null;
  companyPlanStatus: string | null;
  companyPeriodEnd: string | null;
  companyTrialEndsAt: string | null;
  createdAt: string;
  lastSignInAt: string | null;
};

// ── Label helpers ─────────────────────────────────────────────────────────────

const CANDIDATE_PLAN_LABELS: Record<string, string> = {
  professional_monthly: "Professional",
  professional_annual: "Professional (Annual)",
  advanced_monthly: "Advanced",
  advanced_annual: "Advanced (Annual)",
};
const CORP_PLAN_LABELS: Record<string, string> = { team: "Team", business: "Business" };

function getPlanLabel(u: AdminUser) {
  if (u.accountType === "corporate") {
    return u.companyPlanId ? (CORP_PLAN_LABELS[u.companyPlanId] ?? u.companyPlanId) : "—";
  }
  return u.candidatePlanId ? (CANDIDATE_PLAN_LABELS[u.candidatePlanId] ?? u.candidatePlanId) : "Free";
}

function getStatusLabel(u: AdminUser) {
  if (u.accountType === "corporate") {
    const s = u.companyPlanStatus ?? "none";
    return ({ active: "Active", trial: "Trial", expired: "Expired", cancelled: "Cancelled", none: "No plan" })[s] ?? s;
  }
  const s = u.candidateStatus;
  if (!s) return "Free";
  return ({ active: "Active", trialing: "Trialing", past_due: "Past due", canceled: "Cancelled", cancelled: "Cancelled" })[s] ?? s;
}

function getStatusGroup(u: AdminUser): "paid" | "trial" | "free" | "expired" {
  if (u.accountType === "corporate") {
    const s = u.companyPlanStatus ?? "none";
    if (s === "active") return "paid";
    if (s === "trial") return "trial";
    if (s === "expired" || s === "cancelled") return "expired";
    return "free";
  }
  const s = u.candidateStatus;
  if (s === "active" || s === "trialing" || s === "past_due") return "paid";
  if (s === "canceled" || s === "cancelled") return "expired";
  return "free";
}

function getPeriodEnd(u: AdminUser) {
  if (u.accountType === "corporate") return u.companyTrialEndsAt ?? u.companyPeriodEnd ?? null;
  return u.candidatePeriodEnd ?? null;
}

// ── Badges ────────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, string> = {
  candidate:  "bg-violet-500/20 text-violet-300 border-violet-400/25",
  corporate:  "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/25",
  university: "bg-blue-500/20 text-blue-300 border-blue-400/25",
  unknown:    "bg-white/10 text-gray-400 border-white/10",
};
const STATUS_BADGE: Record<string, string> = {
  paid:    "bg-emerald-500/20 text-emerald-300 border-emerald-400/25",
  trial:   "bg-cyan-500/20 text-cyan-300 border-cyan-400/25",
  free:    "bg-white/[0.07] text-gray-400 border-white/10",
  expired: "bg-red-500/20 text-red-300 border-red-400/25",
};

function TypeBadge({ type }: { type: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black capitalize ${TYPE_BADGE[type] ?? TYPE_BADGE.unknown}`}>{type}</span>;
}
function StatusBadge({ user }: { user: AdminUser }) {
  const g = getStatusGroup(user);
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black ${STATUS_BADGE[g]}`}>{getStatusLabel(user)}</span>;
}

// ── CSV export ────────────────────────────────────────────────────────────────

function exportCsv(users: AdminUser[]) {
  const headers = ["ID","First name","Last name","Email","Account type","Plan","Status","Company","Company role","Period / trial end","Joined","Last active"];
  const rows = users.map((u) => [
    u.id, u.firstName ?? "", u.lastName ?? "", u.email, u.accountType,
    getPlanLabel(u), getStatusLabel(u), u.companyName ?? "", u.companyRole ?? "",
    getPeriodEnd(u) ? new Date(getPeriodEnd(u)!).toLocaleDateString("en-GB") : "",
    new Date(u.createdAt).toLocaleDateString("en-GB"),
    u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString("en-GB") : "Never",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: `users-${new Date().toISOString().slice(0,10)}.csv` });
  a.click();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fullName(u: AdminUser) { return [u.firstName, u.lastName].filter(Boolean).join(" ") || "—"; }
function initials(u: AdminUser) { return [u.firstName?.[0], u.lastName?.[0]].filter(Boolean).join("").toUpperCase() || u.email[0].toUpperCase(); }

const PAGE_SIZE = 50;
type SortKey = "name" | "email" | "type" | "joined" | "lastSeen";
type SortDir = "asc" | "desc";

// ── Main component ────────────────────────────────────────────────────────────

export function AdminClient({ users: initialUsers }: { users: AdminUser[] }) {
  const router = useRouter();

  // Local copy so edits/deletes reflect instantly without a full reload
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);

  // Table controls
  const [search, setSearch]           = useState("");
  const [typeFilter, setTypeFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey]         = useState<SortKey>("joined");
  const [sortDir, setSortDir]         = useState<SortDir>("desc");
  const [page, setPage]               = useState(1);
  const [copied, setCopied]           = useState<string | null>(null);

  // Edit modal
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    accountType: "",
    // Candidate billing (Clerk privateMetadata)
    candidateStatus: "",   // active | trialing | past_due | canceled | ""
    candidatePlanId: "",   // professional_monthly | advanced_monthly | etc | ""
    // Corporate billing (Prisma Company.planStatus)
    companyPlanStatus: "", // trial | active | expired | cancelled | ""
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]     = useState("");

  // Delete modal
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState("");

  // Create user modal
  type CreatedResult = { userId: string; email: string; tempPassword: string };
  const [showCreate, setShowCreate]         = useState(false);
  const [createForm, setCreateForm]         = useState({
    email: "", firstName: "", lastName: "",
    accountType: "candidate",
    candidateStatus: "", candidatePlanId: "",
  });
  const [createLoading, setCreateLoading]   = useState(false);
  const [createError, setCreateError]       = useState("");
  const [createdResult, setCreatedResult]   = useState<CreatedResult | null>(null);
  const [copiedPwd, setCopiedPwd]           = useState(false);

  // ── Open modals ─────────────────────────────────────────────────────────────

  function openEdit(u: AdminUser) {
    setEditingUser(u);
    setEditForm({
      firstName: u.firstName ?? "",
      lastName: u.lastName ?? "",
      accountType: u.accountType,
      candidateStatus: u.candidateStatus ?? "",
      candidatePlanId: u.candidatePlanId ?? "",
      companyPlanStatus: u.companyPlanStatus ?? "",
    });
    setEditError("");
  }
  function openDelete(u: AdminUser) {
    setDeletingUser(u);
    setDeleteConfirm("");
    setDeleteError("");
  }

  // ── Save edit ────────────────────────────────────────────────────────────────

  async function saveEdit() {
    if (!editingUser) return;
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editForm.firstName.trim() || null,
          lastName: editForm.lastName.trim() || null,
          accountType: editForm.accountType,
          subscriptionStatus: editForm.candidateStatus || null,
          stripePlanId: editForm.candidatePlanId || null,
          companyPlanStatus: editForm.companyPlanStatus || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setEditError(json.error ?? "Failed to save."); return; }

      // Update local state immediately
      setUsers((prev) => prev.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              firstName: editForm.firstName.trim() || null,
              lastName: editForm.lastName.trim() || null,
              accountType: editForm.accountType,
              candidateStatus: editForm.candidateStatus || null,
              candidatePlanId: editForm.candidatePlanId || null,
              companyPlanStatus: editForm.companyPlanStatus || null,
            }
          : u
      ));
      setEditingUser(null);
      router.refresh(); // sync server state in background
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setEditLoading(false);
    }
  }

  // ── Confirm delete ───────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!deletingUser) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { setDeleteError(json.error ?? "Failed to delete."); return; }

      // Remove from local state immediately
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
      router.refresh();
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Copy ID ──────────────────────────────────────────────────────────────────

  function copyId(id: string) {
    void navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  // ── Create user ──────────────────────────────────────────────────────────────

  function openCreate() {
    setCreateForm({ email: "", firstName: "", lastName: "", accountType: "candidate", candidateStatus: "", candidatePlanId: "" });
    setCreateError("");
    setCreatedResult(null);
    setCopiedPwd(false);
    setShowCreate(true);
  }

  async function submitCreate() {
    setCreateLoading(true);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createForm.email.trim(),
          firstName: createForm.firstName.trim() || undefined,
          lastName: createForm.lastName.trim() || undefined,
          accountType: createForm.accountType,
          subscriptionStatus: createForm.candidateStatus || undefined,
          stripePlanId: createForm.candidatePlanId || undefined,
        }),
      });
      const json = await res.json() as { success?: boolean; error?: string; userId?: string; email?: string; tempPassword?: string };
      if (!res.ok) { setCreateError(json.error ?? "Failed to create user."); return; }

      const result: CreatedResult = {
        userId: json.userId!,
        email: json.email!,
        tempPassword: json.tempPassword!,
      };
      setCreatedResult(result);

      // Add to local table immediately
      const newUser: AdminUser = {
        id: result.userId,
        firstName: createForm.firstName.trim() || null,
        lastName: createForm.lastName.trim() || null,
        email: result.email,
        accountType: createForm.accountType,
        candidatePlanId: createForm.candidatePlanId || null,
        candidateStatus: createForm.candidateStatus || null,
        candidatePeriodEnd: null,
        companyName: null, companyRole: null, companyPlanId: null,
        companyPlanStatus: null, companyPeriodEnd: null, companyTrialEndsAt: null,
        createdAt: new Date().toISOString(),
        lastSignInAt: null,
      };
      setUsers((prev) => [newUser, ...prev]);
      router.refresh();
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  }

  function copyPassword(pwd: string) {
    void navigator.clipboard.writeText(pwd);
    setCopiedPwd(true);
    setTimeout(() => setCopiedPwd(false), 2000);
  }

  // ── Sort ─────────────────────────────────────────────────────────────────────

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const cands = users.filter((u) => u.accountType === "candidate");
    const corps = users.filter((u) => u.accountType === "corporate");
    return {
      total: users.length,
      candidates: cands.length,
      paidCandidates: cands.filter((u) => u.candidateStatus === "active" || u.candidateStatus === "trialing").length,
      corporate: corps.length,
      activeCorporate: corps.filter((u) => u.companyPlanStatus === "active" || u.companyPlanStatus === "trial").length,
    };
  }, [users]);

  // ── Filter + sort + paginate ──────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (q && !fullName(u).toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !(u.companyName ?? "").toLowerCase().includes(q)) return false;
      if (typeFilter !== "all" && u.accountType !== typeFilter) return false;
      if (statusFilter !== "all" && getStatusGroup(u) !== statusFilter) return false;
      return true;
    });
  }, [users, search, typeFilter, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = sortKey === "name" ? fullName(a) : sortKey === "email" ? a.email : sortKey === "type" ? a.accountType : sortKey === "joined" ? a.createdAt : (a.lastSignInAt ?? "");
      const vb = sortKey === "name" ? fullName(b) : sortKey === "email" ? b.email : sortKey === "type" ? b.accountType : sortKey === "joined" ? b.createdAt : (b.lastSignInAt ?? "");
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="ml-1 text-gray-600">↕</span>;
    return <span className="ml-1 text-fuchsia-400">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const thS = "pb-3 text-left text-xs font-black uppercase tracking-[0.14em] text-gray-500 cursor-pointer select-none hover:text-gray-300 transition whitespace-nowrap";
  const thF = "pb-3 text-left text-xs font-black uppercase tracking-[0.14em] text-gray-500 whitespace-nowrap";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0b0918] px-4 py-10 text-white sm:px-8">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-[-0.05em]">Admin</h1>
            <span className="rounded-full border border-red-400/30 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-black text-red-300">Internal only</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">AI Career Mentor · {stats.total} total accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openCreate} className="shrink-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]">
            + Create user
          </button>
          <button onClick={() => exportCsv(sorted)} className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.09]">
            ↓ Export CSV ({sorted.length})
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: "Total users",        value: stats.total,          color: "text-white" },
          { label: "Candidates",         value: stats.candidates,     color: "text-violet-300" },
          { label: "Paid candidates",    value: stats.paidCandidates, color: "text-emerald-300" },
          { label: "Corporate accounts", value: stats.corporate,      color: "text-fuchsia-300" },
          { label: "Active workspaces",  value: stats.activeCorporate,color: "text-cyan-300" },
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
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="rounded-2xl border border-white/10 bg-[#0b0918] px-4 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none">
          <option value="all">All types</option>
          <option value="candidate">Candidate</option>
          <option value="corporate">Corporate</option>
          <option value="university">University</option>
          <option value="unknown">Unknown</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-2xl border border-white/10 bg-[#0b0918] px-4 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none">
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
              <th className={thS} style={{ paddingLeft: "1.5rem", paddingRight: "1rem" }} onClick={() => toggleSort("name")}>User <SortIcon k="name" /></th>
              <th className={thS} onClick={() => toggleSort("type")}>Type <SortIcon k="type" /></th>
              <th className={thF}>Plan</th>
              <th className={thF}>Status</th>
              <th className={thF}>Company</th>
              <th className={thF}>Period end</th>
              <th className={thS} onClick={() => toggleSort("joined")}>Joined <SortIcon k="joined" /></th>
              <th className={thS} onClick={() => toggleSort("lastSeen")}>Last active <SortIcon k="lastSeen" /></th>
              <th className={thF} style={{ paddingRight: "1.5rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {pageData.length === 0 && (
              <tr><td colSpan={9} className="py-16 text-center text-gray-500">No users match your filters.</td></tr>
            )}
            {pageData.map((u) => (
              <tr key={u.id} className="group transition hover:bg-white/[0.03]">
                {/* User */}
                <td className="py-3.5 pl-6 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/20 text-xs font-black text-fuchsia-300">{initials(u)}</div>
                    <div>
                      <p className="font-bold leading-tight text-white">{fullName(u)}</p>
                      <p className="text-[11px] text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 pr-4"><TypeBadge type={u.accountType} /></td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-gray-300">{getPlanLabel(u)}</td>
                <td className="py-3.5 pr-4"><StatusBadge user={u} /></td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-gray-400">
                  {u.companyName ?? "—"}
                  {u.companyRole && <span className="ml-1 text-[10px] capitalize text-gray-600">({u.companyRole})</span>}
                </td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-[12px] text-gray-400">{getPeriodEnd(u) ? fmtDate(getPeriodEnd(u)) : "—"}</td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-[12px] text-gray-400">{fmtDate(u.createdAt)}</td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-[12px] text-gray-400">{fmtDate(u.lastSignInAt)}</td>
                {/* Actions */}
                <td className="py-3.5 pr-6">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(u)}
                      className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-black text-fuchsia-300 transition hover:bg-fuchsia-500/20"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDelete(u)}
                      className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-[11px] font-black text-red-300 transition hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => copyId(u.id)}
                      className="rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1 text-[11px] font-black text-gray-500 transition hover:border-white/20 hover:text-gray-300"
                    >
                      {copied === u.id ? "Copied!" : "ID"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-gray-500">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-black text-white transition hover:bg-white/[0.09] disabled:opacity-30">← Prev</button>
            <span className="flex items-center px-3 text-sm text-gray-500">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-black text-white transition hover:bg-white/[0.09] disabled:opacity-30">Next →</button>
          </div>
        </div>
      )}

      <p className="mt-10 text-center text-[11px] text-gray-700">AI Career Mentor · Internal admin · Not indexed · Not linked from any public page</p>

      {/* ── Create user modal ────────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-sm px-4 py-20" onClick={() => { if (!createLoading) { setShowCreate(false); setCreatedResult(null); } }}>
          <div className="w-full max-w-md rounded-[1.75rem] border border-fuchsia-400/20 bg-[#120a1e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-fuchsia-300">Create user</p>
            <h3 className="mt-1 text-xl font-black text-white">New account</h3>

            {createdResult ? (
              /* ── Success state ─────────────────────── */
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.07] px-4 py-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <div>
                    <p className="text-sm font-black text-emerald-300">Account created</p>
                    <p className="mt-0.5 text-[12px] text-emerald-200/70">{createdResult.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Temporary password — share this once</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <code className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm tracking-widest text-fuchsia-300 select-all">
                      {createdResult.tempPassword}
                    </code>
                    <button
                      onClick={() => copyPassword(createdResult.tempPassword)}
                      className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-[11px] font-black text-gray-300 transition hover:bg-white/10"
                    >
                      {copiedPwd ? "✓" : "Copy"}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-amber-400/80">
                    ⚠ This password will not be shown again. Share it securely with the user — they will be required to change it when they first sign in.
                  </p>
                </div>

                <button
                  onClick={() => { setShowCreate(false); setCreatedResult(null); }}
                  className="w-full rounded-full border border-white/10 bg-white/[0.05] py-2.5 text-sm font-black text-white transition hover:bg-white/[0.09]"
                >
                  Done
                </button>
              </div>
            ) : (
              /* ── Form state ────────────────────────── */
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Email address <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                    disabled={createLoading}
                    placeholder="user@example.com"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-fuchsia-400/40 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">First name</label>
                    <input
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                      disabled={createLoading}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-fuchsia-400/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Last name</label>
                    <input
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                      disabled={createLoading}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-fuchsia-400/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Account type <span className="text-red-400">*</span></label>
                  <select
                    value={createForm.accountType}
                    onChange={(e) => setCreateForm((f) => ({ ...f, accountType: e.target.value }))}
                    disabled={createLoading}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none"
                  >
                    <option value="candidate">Candidate</option>
                    <option value="corporate">Corporate</option>
                    <option value="university">University</option>
                  </select>
                </div>

                {createForm.accountType !== "corporate" && (
                  <>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Subscription status <span className="text-gray-600">(optional)</span></label>
                      <select
                        value={createForm.candidateStatus}
                        onChange={(e) => setCreateForm((f) => ({ ...f, candidateStatus: e.target.value }))}
                        disabled={createLoading}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none"
                      >
                        <option value="">Free</option>
                        <option value="active">Active</option>
                        <option value="trialing">Trialing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Plan <span className="text-gray-600">(optional)</span></label>
                      <select
                        value={createForm.candidatePlanId}
                        onChange={(e) => setCreateForm((f) => ({ ...f, candidatePlanId: e.target.value }))}
                        disabled={createLoading}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none"
                      >
                        <option value="">None / Free</option>
                        <option value="professional_monthly">Professional (Monthly)</option>
                        <option value="professional_annual">Professional (Annual)</option>
                        <option value="advanced_monthly">Advanced (Monthly)</option>
                        <option value="advanced_annual">Advanced (Annual)</option>
                      </select>
                    </div>
                  </>
                )}

                {createError && <p className="text-sm font-semibold text-red-300">{createError}</p>}

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowCreate(false)} disabled={createLoading} className="flex-1 rounded-full border border-white/10 bg-white/[0.04] py-2.5 text-sm font-black text-white transition hover:bg-white/[0.08] disabled:opacity-50">Cancel</button>
                  <button
                    onClick={() => void submitCreate()}
                    disabled={createLoading || !createForm.email.trim()}
                    className="flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 py-2.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-60"
                  >
                    {createLoading ? "Creating…" : "Create account"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit modal ──────────────────────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-sm px-4 py-20" onClick={() => { if (!editLoading) setEditingUser(null); }}>
          <div className="w-full max-w-md rounded-[1.75rem] border border-fuchsia-400/20 bg-[#120a1e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-fuchsia-300">Edit user</p>
            <h3 className="mt-1 text-xl font-black text-white">{editingUser.email}</h3>
            <p className="mt-0.5 text-[11px] text-gray-600">Clerk ID: {editingUser.id}</p>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">First name</label>
                  <input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                    disabled={editLoading}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-fuchsia-400/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Last name</label>
                  <input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                    disabled={editLoading}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-fuchsia-400/40 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Account type</label>
                <select
                  value={editForm.accountType}
                  onChange={(e) => setEditForm((f) => ({ ...f, accountType: e.target.value }))}
                  disabled={editLoading}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none"
                >
                  <option value="candidate">Candidate</option>
                  <option value="corporate">Corporate</option>
                  <option value="university">University</option>
                  <option value="unknown">Unknown</option>
                </select>
                <p className="mt-1.5 text-[11px] text-amber-400/80">⚠ Changing account type affects which part of the site they can access.</p>
              </div>

              {/* Candidate billing fields — shown when account type is candidate (or unknown) */}
              {editForm.accountType !== "corporate" && (
                <>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Subscription status</label>
                    <select
                      value={editForm.candidateStatus}
                      onChange={(e) => setEditForm((f) => ({ ...f, candidateStatus: e.target.value }))}
                      disabled={editLoading}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none"
                    >
                      <option value="">Free (no active subscription)</option>
                      <option value="active">Active</option>
                      <option value="trialing">Trialing</option>
                      <option value="past_due">Past due</option>
                      <option value="canceled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Plan</label>
                    <select
                      value={editForm.candidatePlanId}
                      onChange={(e) => setEditForm((f) => ({ ...f, candidatePlanId: e.target.value }))}
                      disabled={editLoading}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none"
                    >
                      <option value="">None / Free</option>
                      <option value="professional_monthly">Professional (Monthly)</option>
                      <option value="professional_annual">Professional (Annual)</option>
                      <option value="advanced_monthly">Advanced (Monthly)</option>
                      <option value="advanced_annual">Advanced (Annual)</option>
                    </select>
                    <p className="mt-1.5 text-[11px] text-gray-600">Set both status and plan to grant or revoke paid access.</p>
                  </div>
                </>
              )}

              {/* Corporate billing fields — shown when account type is corporate */}
              {editForm.accountType === "corporate" && (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Workspace plan status</label>
                  <select
                    value={editForm.companyPlanStatus}
                    onChange={(e) => setEditForm((f) => ({ ...f, companyPlanStatus: e.target.value }))}
                    disabled={editLoading}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none"
                  >
                    <option value="">No plan</option>
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <p className="mt-1.5 text-[11px] text-gray-600">Updates the company workspace — affects all members of that workspace.</p>
                </div>
              )}

              {editError && <p className="text-sm font-semibold text-red-300">{editError}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditingUser(null)} disabled={editLoading} className="flex-1 rounded-full border border-white/10 bg-white/[0.04] py-2.5 text-sm font-black text-white transition hover:bg-white/[0.08] disabled:opacity-50">Cancel</button>
                <button onClick={() => void saveEdit()} disabled={editLoading} className="flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 py-2.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-60">
                  {editLoading ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete modal ─────────────────────────────────────────────────────────── */}
      {deletingUser && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-sm px-4 py-20" onClick={() => { if (!deleteLoading) setDeletingUser(null); }}>
          <div className="w-full max-w-md rounded-[1.75rem] border border-red-500/30 bg-[#160a14] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-red-300">Delete account</p>
            <h3 className="mt-1 text-xl font-black text-white">{fullName(deletingUser)}</h3>
            <p className="mt-0.5 text-sm text-gray-400">{deletingUser.email}</p>

            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-xs leading-5 text-red-200/80">
              This permanently deletes their Clerk account and removes them from any company workspace.
              Their practice session data and assessment results will remain in the database.
              <strong className="block mt-1 text-red-200">This cannot be undone.</strong>
            </div>

            <label className="mt-4 block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">
              Type their email to confirm
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError(""); }}
              disabled={deleteLoading}
              placeholder={deletingUser.email}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-red-400/40 focus:outline-none"
            />

            {deleteError && <p className="mt-2 text-sm font-semibold text-red-300">{deleteError}</p>}

            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeletingUser(null)} disabled={deleteLoading} className="flex-1 rounded-full border border-white/10 bg-white/[0.04] py-2.5 text-sm font-black text-white transition hover:bg-white/[0.08] disabled:opacity-50">Cancel</button>
              <button
                onClick={() => void confirmDelete()}
                disabled={deleteLoading || deleteConfirm.trim() !== deletingUser.email}
                className="flex-1 rounded-full bg-red-600/90 py-2.5 text-sm font-black text-white shadow-lg transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleteLoading ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
