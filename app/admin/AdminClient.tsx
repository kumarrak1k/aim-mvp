"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

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
  compPlan: string | null;
  compUntil: string | null;
  companyName: string | null;
  companyRole: string | null;
  companyPlanId: string | null;
  companyPlanStatus: string | null;
  companyPeriodEnd: string | null;
  companyTrialEndsAt: string | null;
  createdAt: string;
  lastSignInAt: string | null;
};

// ── Membership helpers ────────────────────────────────────────────────────────

/**
 * A single canonical "membership key" that encodes both tier and status.
 * This is what the dropdowns use — it maps cleanly to/from the raw Clerk + Prisma fields.
 */
type MembershipKey =
  // Candidate tiers
  | "free" | "plus" | "professional"
  // Corporate tiers + states
  | "none" | "team_trial" | "team" | "business_trial" | "business" | "custom"
  | "expired" | "cancelled";

/** Derive a MembershipKey from an AdminUser's current stored values. */
function toMembershipKey(u: AdminUser): MembershipKey {
  if (u.accountType === "corporate") {
    const s = u.companyPlanStatus ?? "";
    const p = (u.companyPlanId ?? "").toLowerCase();
    if (!s || s === "none") return "none";
    if (s === "expired")   return "expired";
    if (s === "cancelled") return "cancelled";
    if (s === "trial")     return p === "business" ? "business_trial" : "team_trial";
    // active
    if (p === "business") return "business";
    if (p === "custom")   return "custom";
    return "team";
  }
  // Candidate
  const status = u.candidateStatus ?? "";
  const plan   = (u.candidatePlanId ?? "").toLowerCase();
  if (status !== "active" && status !== "trialing" && status !== "past_due") return "free";
  if (plan.includes("professional")) return "professional";
  if (plan.includes("plus"))         return "plus";
  return "free";
}

/** Convert a MembershipKey back to the raw API fields for PATCH / create. */
function fromMembershipKey(accountType: string, key: MembershipKey): {
  subscriptionStatus: string | null;
  stripePlanId: string | null;
  companyPlanStatus: string | null;
  companyPlanId: string | null;
} {
  if (accountType === "corporate") {
    switch (key) {
      case "none":          return { subscriptionStatus: null, stripePlanId: null, companyPlanStatus: null,        companyPlanId: null };
      case "team_trial":    return { subscriptionStatus: null, stripePlanId: null, companyPlanStatus: "trial",     companyPlanId: "team" };
      case "team":          return { subscriptionStatus: null, stripePlanId: null, companyPlanStatus: "active",    companyPlanId: "team" };
      case "business_trial":return { subscriptionStatus: null, stripePlanId: null, companyPlanStatus: "trial",     companyPlanId: "business" };
      case "business":      return { subscriptionStatus: null, stripePlanId: null, companyPlanStatus: "active",    companyPlanId: "business" };
      case "custom":        return { subscriptionStatus: null, stripePlanId: null, companyPlanStatus: "active",    companyPlanId: "custom" };
      case "expired":       return { subscriptionStatus: null, stripePlanId: null, companyPlanStatus: "expired",   companyPlanId: null };
      case "cancelled":     return { subscriptionStatus: null, stripePlanId: null, companyPlanStatus: "cancelled", companyPlanId: null };
      default:              return { subscriptionStatus: null, stripePlanId: null, companyPlanStatus: null,        companyPlanId: null };
    }
  }
  // Candidate
  switch (key) {
    case "plus":          return { subscriptionStatus: "active", stripePlanId: "plus_monthly",          companyPlanStatus: null, companyPlanId: null };
    case "professional":  return { subscriptionStatus: "active", stripePlanId: "professional_monthly",  companyPlanStatus: null, companyPlanId: null };
    default:              return { subscriptionStatus: null,     stripePlanId: null,                    companyPlanStatus: null, companyPlanId: null };
  }
}

/** True when the user has an unexpired admin-granted complimentary plan. */
function hasActiveComp(u: AdminUser): boolean {
  const plan = (u.compPlan ?? "").toLowerCase();
  return (
    (plan === "plus" || plan === "professional") &&
    !!u.compUntil &&
    new Date(u.compUntil).getTime() > Date.now()
  );
}

/** Human-readable membership label shown in the table. */
function getMembershipLabel(u: AdminUser): string {
  if (u.accountType === "corporate") {
    const s = u.companyPlanStatus ?? "";
    const p = (u.companyPlanId ?? "").toLowerCase();
    if (!s || s === "none") return "No plan";
    const tierName = p === "business" ? "Business" : p === "custom" ? "Custom" : "Team";
    if (s === "trial")     return `${tierName} (Trial)`;
    if (s === "active")    return tierName;
    if (s === "expired")   return `${tierName} (Expired)`;
    if (s === "cancelled") return "Cancelled";
    return tierName;
  }
  // Candidate
  const status = u.candidateStatus ?? "";
  const plan   = (u.candidatePlanId ?? "").toLowerCase();
  const tier   = plan.includes("professional") ? "Professional" : plan.includes("plus") ? "Plus" : null;
  if (!tier || (!["active","trialing","past_due"].includes(status))) {
    if (hasActiveComp(u)) {
      return `${u.compPlan!.toLowerCase() === "professional" ? "Professional" : "Plus"} (Comp)`;
    }
    return "Free";
  }
  if (status === "trialing") return `${tier} (Trial)`;
  if (status === "past_due") return `${tier} (Past due)`;
  return tier;
}

function getStatusGroup(u: AdminUser): "paid" | "trial" | "free" | "expired" {
  if (u.accountType === "corporate") {
    const s = u.companyPlanStatus ?? "none";
    if (s === "active")   return "paid";
    if (s === "trial")    return "trial";
    if (s === "expired" || s === "cancelled") return "expired";
    return "free";
  }
  const s = u.candidateStatus ?? "";
  if (s === "active" || s === "past_due") return "paid";
  if (s === "trialing") return "trial";
  if (s === "canceled" || s === "cancelled") return "expired";
  if (hasActiveComp(u)) return "trial"; // comp guests share the cyan badge
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
function MembershipBadge({ user }: { user: AdminUser }) {
  const g = getStatusGroup(user);
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black ${STATUS_BADGE[g]}`}>{getMembershipLabel(user)}</span>;
}

// ── CSV export ────────────────────────────────────────────────────────────────

function exportCsv(users: AdminUser[]) {
  const headers = ["ID","First name","Last name","Email","Account type","Membership","Company","Company role","Period / trial end","Joined","Last active"];
  const rows = users.map((u) => [
    u.id, u.firstName ?? "", u.lastName ?? "", u.email, u.accountType,
    getMembershipLabel(u), u.companyName ?? "", u.companyRole ?? "",
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
function fullName(u: AdminUser) { return [u.firstName, u.lastName].filter(Boolean).join(" ") || "–"; }
function initials(u: AdminUser) { return [u.firstName?.[0], u.lastName?.[0]].filter(Boolean).join("").toUpperCase() || u.email[0].toUpperCase(); }

const PAGE_SIZE = 50;
type SortKey = "name" | "email" | "type" | "joined" | "lastSeen";
type SortDir = "asc" | "desc";

// ── Main component ────────────────────────────────────────────────────────────

export function AdminClient({ users: initialUsers, adminEmail }: { users: AdminUser[]; adminEmail: string }) {
  const router = useRouter();
  const { signOut } = useClerk();

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
    membership: "free" as MembershipKey,
    companyName: "",
    periodEnd: "", // YYYY-MM-DD
    compPlan: "",  // "" | "plus" | "professional"
    compUntil: "", // YYYY-MM-DD
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]     = useState("");

  // Delete modal
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError]     = useState("");

  // Create user modal
  type CreatedResult = {
    userId: string; email: string; firstName: string | null; accountType: string;
    signInUrl: string; emailSent: boolean; emailError?: string;
  };
  const [showCreate, setShowCreate]         = useState(false);
  const [createForm, setCreateForm]         = useState({
    email: "", firstName: "", lastName: "",
    accountType: "candidate",
    membership: "free" as MembershipKey,
    compPlan: "",       // "" | "plus" | "professional"
    compDuration: "90", // days: 7 | 30 | 90 | 365
  });
  const [createLoading, setCreateLoading]   = useState(false);
  const [createError, setCreateError]       = useState("");
  const [createdResult, setCreatedResult]   = useState<CreatedResult | null>(null);
  const [resendLoading, setResendLoading]   = useState(false);
  const [resendSent, setResendSent]         = useState(false);
  const [resendError, setResendError]       = useState("");
  const [showFallbackUrl, setShowFallbackUrl] = useState(false);
  const [copiedUrl, setCopiedUrl]           = useState(false);

  // ── Open modals ─────────────────────────────────────────────────────────────

  function openEdit(u: AdminUser) {
    setEditingUser(u);
    const pe = getPeriodEnd(u);
    setEditForm({
      firstName: u.firstName ?? "",
      lastName: u.lastName ?? "",
      accountType: u.accountType,
      membership: toMembershipKey(u),
      companyName: u.companyName ?? "",
      periodEnd: pe ? pe.slice(0, 10) : "",
      compPlan: (u.compPlan ?? "").toLowerCase(),
      compUntil: u.compUntil ? u.compUntil.slice(0, 10) : "",
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
    if (editForm.compPlan && !editForm.compUntil) {
      setEditError("Set an end date for the complimentary access.");
      return;
    }
    setEditLoading(true);
    setEditError("");
    try {
      const billing = fromMembershipKey(editForm.accountType, editForm.membership);
      const isCorp = editForm.accountType === "corporate";
      const compPlan = !isCorp && editForm.compPlan ? editForm.compPlan : null;
      const compUntil = compPlan ? editForm.compUntil : null;
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editForm.firstName.trim() || null,
          lastName: editForm.lastName.trim() || null,
          accountType: editForm.accountType,
          subscriptionStatus: billing.subscriptionStatus,
          stripePlanId: billing.stripePlanId,
          companyPlanStatus: billing.companyPlanStatus,
          companyPlanId: billing.companyPlanId,
          // Company name (corporate only)
          ...(isCorp && { companyName: editForm.companyName.trim() || null }),
          // Period end — routed to the right field by account type
          ...(isCorp
            ? { companyPeriodEnd: editForm.periodEnd || null }
            : { candidatePeriodEnd: editForm.periodEnd || null }),
          // Complimentary access (candidates only; null revokes)
          compPlan,
          compUntil,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setEditError(json.error ?? "Failed to save."); return; }

      // Update local state immediately
      const periodIso = editForm.periodEnd ? new Date(editForm.periodEnd).toISOString() : null;
      setUsers((prev) => prev.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              firstName: editForm.firstName.trim() || null,
              lastName: editForm.lastName.trim() || null,
              accountType: editForm.accountType,
              candidateStatus: billing.subscriptionStatus,
              candidatePlanId: billing.stripePlanId,
              candidatePeriodEnd: editForm.accountType !== "corporate" ? periodIso : u.candidatePeriodEnd,
              compPlan,
              compUntil: compUntil ? new Date(compUntil).toISOString() : null,
              companyPlanStatus: billing.companyPlanStatus,
              companyPlanId: billing.companyPlanId ?? u.companyPlanId,
              companyName: editForm.accountType === "corporate" ? (editForm.companyName.trim() || u.companyName) : u.companyName,
              companyPeriodEnd: editForm.accountType === "corporate" ? periodIso : u.companyPeriodEnd,
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
    setCreateForm({ email: "", firstName: "", lastName: "", accountType: "candidate", membership: "free", compPlan: "", compDuration: "90" });
    setCreateError("");
    setCreatedResult(null);
    setResendSent(false);
    setResendError("");
    setShowFallbackUrl(false);
    setCopiedUrl(false);
    setShowCreate(true);
  }

  async function submitCreate() {
    setCreateLoading(true);
    setCreateError("");
    try {
      const billing = fromMembershipKey(createForm.accountType, createForm.membership);
      const isCandidate = createForm.accountType === "candidate";
      const compPlan = isCandidate && createForm.compPlan ? createForm.compPlan : null;
      const compUntil = compPlan
        ? new Date(Date.now() + Number(createForm.compDuration) * 24 * 60 * 60 * 1000).toISOString()
        : null;
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createForm.email.trim(),
          firstName: createForm.firstName.trim() || undefined,
          lastName: createForm.lastName.trim() || undefined,
          accountType: createForm.accountType,
          subscriptionStatus: billing.subscriptionStatus || undefined,
          stripePlanId: billing.stripePlanId || undefined,
          ...(compPlan && { compPlan, compUntil }),
        }),
      });
      const json = await res.json() as {
        success?: boolean; error?: string; userId?: string; email?: string;
        signInUrl?: string; emailSent?: boolean; emailError?: string;
      };
      if (!res.ok) { setCreateError(json.error ?? "Failed to create user."); return; }

      const result: CreatedResult = {
        userId: json.userId!,
        email: json.email!,
        firstName: createForm.firstName.trim() || null,
        accountType: createForm.accountType,
        signInUrl: json.signInUrl!,
        emailSent: json.emailSent ?? false,
        emailError: json.emailError,
      };
      // If email failed, show the fallback URL automatically
      if (!result.emailSent) setShowFallbackUrl(true);
      setCreatedResult(result);

      // Add to local table immediately
      const newUser: AdminUser = {
        id: result.userId,
        firstName: createForm.firstName.trim() || null,
        lastName: createForm.lastName.trim() || null,
        email: result.email,
        accountType: createForm.accountType,
        candidatePlanId: billing.stripePlanId,
        candidateStatus: billing.subscriptionStatus,
        candidatePeriodEnd: null,
        compPlan,
        compUntil,
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

  async function resendWelcomeEmail(result: CreatedResult) {
    setResendLoading(true);
    setResendError("");
    try {
      const res = await fetch("/api/admin/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: result.userId,
          email: result.email,
          firstName: result.firstName,
          accountType: result.accountType,
        }),
      });
      const json = await res.json() as { success?: boolean; error?: string; signInUrl?: string };
      if (!res.ok) { setResendError(json.error ?? "Failed to send email."); return; }
      setResendSent(true);
    } catch {
      setResendError("Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  }

  function copyFallbackUrl(url: string) {
    void navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
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
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={openCreate} className="shrink-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]">
            + Create user
          </button>
          <button onClick={() => exportCsv(sorted)} className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.09]">
            ↓ Export CSV ({sorted.length})
          </button>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] pl-3 pr-1 py-1">
            <span className="text-xs text-gray-400 hidden sm:inline">{adminEmail}</span>
            <button
              onClick={() => signOut({ redirectUrl: "/admin/sign-in" })}
              className="rounded-full bg-white/[0.07] px-3 py-1.5 text-xs font-black text-gray-300 transition hover:bg-red-500/20 hover:text-red-300"
            >
              Sign out
            </button>
          </div>
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
              <th className={thF}>Membership</th>
              <th className={thF}>Company</th>
              <th className={thF}>Period end</th>
              <th className={thS} onClick={() => toggleSort("joined")}>Joined <SortIcon k="joined" /></th>
              <th className={thS} onClick={() => toggleSort("lastSeen")}>Last active <SortIcon k="lastSeen" /></th>
              <th className={thF} style={{ paddingRight: "1.5rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {pageData.length === 0 && (
              <tr><td colSpan={8} className="py-16 text-center text-gray-500">No users match your filters.</td></tr>
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
                <td className="py-3.5 pr-4"><MembershipBadge user={u} /></td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-gray-400">
                  {u.companyName ?? "–"}
                  {u.companyRole && <span className="ml-1 text-[10px] capitalize text-gray-600">({u.companyRole})</span>}
                </td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-[12px] text-gray-400">{getPeriodEnd(u) ? fmtDate(getPeriodEnd(u)) : "–"}</td>
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
              <div className="mt-5 space-y-3">

                {/* Account created */}
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.07] px-4 py-3">
                  <svg className="h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <div>
                    <p className="text-sm font-black text-emerald-300">Account created</p>
                    <p className="text-[12px] text-emerald-200/60">{createdResult.email}</p>
                  </div>
                </div>

                {/* Email status */}
                {createdResult.emailSent && !resendSent && (
                  <div className="flex items-center gap-3 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/[0.07] px-4 py-3">
                    <svg className="h-4 w-4 shrink-0 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <p className="text-sm font-black text-fuchsia-300">Sign-in link emailed to {createdResult.email}</p>
                  </div>
                )}

                {resendSent && (
                  <div className="flex items-center gap-3 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/[0.07] px-4 py-3">
                    <svg className="h-4 w-4 shrink-0 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <p className="text-sm font-black text-fuchsia-300">Email resent to {createdResult.email}</p>
                  </div>
                )}

                {/* Email failed — hard-to-miss error + auto-show fallback */}
                {!createdResult.emailSent && !resendSent && (
                  <div className="rounded-2xl border border-red-400/30 bg-red-500/[0.08] px-4 py-3">
                    <p className="text-sm font-black text-red-300">⚠ Email could not be sent</p>
                    <p className="mt-0.5 text-[12px] text-red-200/70">{createdResult.emailError ?? "Unknown error. Check Vercel logs."}</p>
                  </div>
                )}

                {/* Resend button — shown if first email succeeded or failed */}
                {!resendSent && (
                  <div className="space-y-1.5">
                    {resendError && (
                      <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-300">{resendError}</p>
                    )}
                    <button
                      onClick={() => void resendWelcomeEmail(createdResult)}
                      disabled={resendLoading}
                      className="w-full rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 py-2.5 text-sm font-black text-fuchsia-300 transition hover:bg-fuchsia-500/20 disabled:opacity-50"
                    >
                      {resendLoading ? "Sending…" : createdResult.emailSent ? "Resend email" : "Try sending email again"}
                    </button>
                  </div>
                )}

                {/* Fallback: copy link manually */}
                <div>
                  <button
                    onClick={() => setShowFallbackUrl((v) => !v)}
                    className="text-[11px] text-gray-500 hover:text-gray-300 transition"
                  >
                    {showFallbackUrl ? "Hide" : "Or copy sign-in link manually ↓"}
                  </button>
                  {showFallbackUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        readOnly
                        value={createdResult.signInUrl}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[10px] text-fuchsia-300 focus:outline-none truncate"
                      />
                      <button
                        onClick={() => copyFallbackUrl(createdResult.signInUrl)}
                        className="shrink-0 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] font-black text-gray-300 transition hover:bg-white/10"
                      >
                        {copiedUrl ? "✓" : "Copy"}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setShowCreate(false); setCreatedResult(null); }}
                  className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 text-sm font-black text-white transition hover:bg-white/[0.08]"
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
                    onChange={(e) => setCreateForm((f) => ({ ...f, accountType: e.target.value, membership: "free" }))}
                    disabled={createLoading}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none"
                  >
                    <option value="candidate">Candidate</option>
                    <option value="corporate">Corporate</option>
                    <option value="university">University</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Membership</label>
                  <select
                    value={createForm.membership}
                    onChange={(e) => setCreateForm((f) => ({ ...f, membership: e.target.value as MembershipKey }))}
                    disabled={createLoading || !!createForm.compPlan}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none disabled:opacity-40"
                  >
                    {createForm.accountType === "corporate" ? (
                      <>
                        <option value="none">No plan</option>
                        <option value="team_trial">Team (Trial)</option>
                        <option value="team">Team</option>
                        <option value="business_trial">Business (Trial)</option>
                        <option value="business">Business</option>
                        <option value="custom">Custom</option>
                      </>
                    ) : (
                      <>
                        <option value="free">Free</option>
                        <option value="plus">Plus</option>
                        <option value="professional">Professional</option>
                      </>
                    )}
                  </select>
                  {createForm.accountType === "candidate" && (
                    <p className="mt-1.5 text-[11px] text-gray-600">
                      {createForm.compPlan
                        ? "Locked to Free while complimentary access is set. Guests must not look like paying subscribers."
                        : "Membership = a real paid subscription. For invited guests leave this on Free and use complimentary access below."}
                    </p>
                  )}
                </div>

                {/* Complimentary access — candidates only */}
                {createForm.accountType === "candidate" && (
                  <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3.5">
                    <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300">Complimentary access</label>
                    <p className="mt-1 text-[11px] leading-4 text-gray-500">
                      Guest access with no card and no Stripe. Expires automatically, then the account returns to Free with nothing to cancel.
                    </p>
                    <div className="mt-2.5 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Plan</label>
                        <select
                          value={createForm.compPlan}
                          onChange={(e) => setCreateForm((f) => ({ ...f, compPlan: e.target.value, ...(e.target.value ? { membership: "free" as MembershipKey } : {}) }))}
                          disabled={createLoading || createForm.membership !== "free"}
                          className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none disabled:opacity-40"
                        >
                          <option value="">None</option>
                          <option value="plus">Plus</option>
                          <option value="professional">Professional</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Duration</label>
                        <select
                          value={createForm.compDuration}
                          onChange={(e) => setCreateForm((f) => ({ ...f, compDuration: e.target.value }))}
                          disabled={createLoading || !createForm.compPlan}
                          className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none disabled:opacity-40"
                        >
                          <option value="7">1 week</option>
                          <option value="30">1 month</option>
                          <option value="90">3 months</option>
                          <option value="365">12 months</option>
                        </select>
                      </div>
                    </div>
                  </div>
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
                  onChange={(e) => setEditForm((f) => ({ ...f, accountType: e.target.value, membership: "free" }))}
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

              {/* Membership — options adapt to account type */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Membership</label>
                <select
                  value={editForm.membership}
                  onChange={(e) => setEditForm((f) => ({ ...f, membership: e.target.value as MembershipKey }))}
                  disabled={editLoading || (editForm.accountType === "candidate" && !!editForm.compPlan)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none disabled:opacity-40"
                >
                  {editForm.accountType === "corporate" ? (
                    <>
                      <option value="none">No plan</option>
                      <option value="team_trial">Team (Trial)</option>
                      <option value="team">Team</option>
                      <option value="business_trial">Business (Trial)</option>
                      <option value="business">Business</option>
                      <option value="custom">Custom</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  ) : (
                    <>
                      <option value="free">Free</option>
                      <option value="plus">Plus</option>
                      <option value="professional">Professional</option>
                    </>
                  )}
                </select>
                {editForm.accountType === "corporate" && (
                  <p className="mt-1.5 text-[11px] text-gray-600">Affects all members of this company workspace.</p>
                )}
                {editForm.accountType === "candidate" && !!editForm.compPlan && (
                  <p className="mt-1.5 text-[11px] text-gray-600">Locked to Free while complimentary access is set. Remove the complimentary plan first to set a paid membership manually.</p>
                )}
              </div>

              {/* Company name — corporate only */}
              {editForm.accountType === "corporate" && (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Company name</label>
                  <input
                    value={editForm.companyName}
                    onChange={(e) => setEditForm((f) => ({ ...f, companyName: e.target.value }))}
                    disabled={editLoading}
                    placeholder="Acme Corp"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-fuchsia-400/40 focus:outline-none"
                  />
                </div>
              )}

              {/* Period end */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">
                  {editForm.accountType === "corporate" ? "Trial / subscription end" : "Subscription end"}
                </label>
                <input
                  type="date"
                  value={editForm.periodEnd}
                  onChange={(e) => setEditForm((f) => ({ ...f, periodEnd: e.target.value }))}
                  disabled={editLoading}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none [color-scheme:dark]"
                />
              </div>

              {/* Complimentary access — candidates only */}
              {editForm.accountType === "candidate" && (
                <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3.5">
                  <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300">Complimentary access</label>
                  <p className="mt-1 text-[11px] leading-4 text-gray-500">
                    Guest access with no card and no Stripe. It expires automatically on the end date, then the user returns to Free with nothing to cancel. A paid subscription always takes precedence.
                  </p>
                  <div className="mt-2.5 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Plan</label>
                      <select
                        value={editForm.compPlan}
                        onChange={(e) => setEditForm((f) => ({ ...f, compPlan: e.target.value, ...(e.target.value ? { membership: "free" as MembershipKey } : {}) }))}
                        disabled={editLoading || editForm.membership !== "free"}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none disabled:opacity-40"
                      >
                        <option value="">None</option>
                        <option value="plus">Plus</option>
                        <option value="professional">Professional</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Until</label>
                      <input
                        type="date"
                        value={editForm.compUntil}
                        onChange={(e) => setEditForm((f) => ({ ...f, compUntil: e.target.value }))}
                        disabled={editLoading || !editForm.compPlan}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none [color-scheme:dark] disabled:opacity-40"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Joined — read-only */}
              {editingUser && (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Joined</label>
                  <p className="mt-1.5 px-3 py-2.5 text-sm text-gray-500">{fmtDate(editingUser.createdAt)}</p>
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
