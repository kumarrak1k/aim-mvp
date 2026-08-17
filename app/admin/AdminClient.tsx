"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { deriveChannel } from "@/app/lib/attributionChannel";
import { UserActivityPanel } from "./UserActivityPanel";

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
  companyCompUntil: string | null;
  trialEndsAt: string | null;
  trialConsumed: boolean;
  signupCountry: string | null;
  // Usage aggregates (Prisma)
  practiceCount: number;
  lastPracticeAt: string | null;
  acCount: number;
  lastAcAt: string | null;
  docsCount: number;
  lastDocAt: string | null;
  profileComplete: boolean;
  // First-touch acquisition attribution
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  promoCode: string | null;
  referrer: string | null;
  landingPath: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  lastActiveAt: string | null;
};

/** Platform-level usage + growth stats computed server-side in page.tsx. */
export type AdminOverview = {
  /** Signup counts per acquisition channel (all-time + last 30 days). */
  acquisition: Array<{ channel: string; total: number; last30d: number }>;
  newUsers7d: number;
  newUsers30d: number;
  activeUsers7d: number;
  activeUsers30d: number;
  trialsActive: number;
  compActive: number;
  payingPlus: number;
  payingProfessional: number;
  sessionsTotal: number;
  sessions7d: number;
  sessions30d: number;
  acTotal: number;
  ac7d: number;
  ac30d: number;
  docsTotal: number;
  docs7d: number;
  docs30d: number;
  funnel: { signedUp: number; profileDone: number; practised: number; paying: number };
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
  | "team_comp" | "business_comp"
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
    if (s === "comp")      return p === "business" ? "business_comp" : "team_comp";
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
      case "team_comp":     return { subscriptionStatus: null, stripePlanId: null, companyPlanStatus: "comp",      companyPlanId: "team" };
      case "business_comp": return { subscriptionStatus: null, stripePlanId: null, companyPlanStatus: "comp",      companyPlanId: "business" };
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
    if (s === "comp")      return `${tierName} (Comp)`;
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
    // "Free" alone conflates two very different people: someone who never
    // started a trial (not convinced enough to try) and someone who used the
    // trial and chose not to pay (tried it, was not convinced). They need
    // different follow-up, so the distinction is surfaced here. trialConsumed
    // is already fetched from Clerk metadata.
    return u.trialConsumed ? "Free (trial used)" : "Free (no trial)";
  }
  if (status === "trialing") return `${tier} (Trial)`;
  if (status === "past_due") return `${tier} (Past due)`;
  return tier;
}

function getStatusGroup(u: AdminUser): "paid" | "trial" | "free" | "expired" {
  if (u.accountType === "corporate") {
    const s = u.companyPlanStatus ?? "none";
    if (s === "active")   return "paid";
    if (s === "trial" || s === "comp") return "trial";
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
  if (u.accountType === "corporate") {
    if ((u.companyPlanStatus ?? "") === "comp") return u.companyCompUntil ?? null;
    return u.companyTrialEndsAt ?? u.companyPeriodEnd ?? null;
  }
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
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[12px] font-bold capitalize ${TYPE_BADGE[type] ?? TYPE_BADGE.unknown}`}>{type}</span>;
}
function MembershipBadge({ user }: { user: AdminUser }) {
  const g = getStatusGroup(user);
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[12px] font-bold ${STATUS_BADGE[g]}`}>{getMembershipLabel(user)}</span>;
}

// ── CSV export ────────────────────────────────────────────────────────────────

function exportCsv(users: AdminUser[]) {
  const headers = ["ID","First name","Last name","Email","Account type","Membership","Company","Company role","Period / trial end","Practice sessions","Last session","Assessment centres","Career docs","Profile built","Source channel","UTM source","UTM medium","UTM campaign","Promo code","Referrer","Landing page","Country","Joined","Last sign-in","Last active"];
  const rows = users.map((u) => [
    u.id, u.firstName ?? "", u.lastName ?? "", u.email, u.accountType,
    getMembershipLabel(u), u.companyName ?? "", u.companyRole ?? "",
    getPeriodEnd(u) ? new Date(getPeriodEnd(u)!).toLocaleDateString("en-GB") : "",
    u.practiceCount,
    u.lastPracticeAt ? new Date(u.lastPracticeAt).toLocaleDateString("en-GB") : "",
    u.acCount,
    u.docsCount,
    u.profileComplete ? "yes" : "no",
    deriveChannel(u),
    u.utmSource ?? "", u.utmMedium ?? "", u.utmCampaign ?? "",
    u.promoCode ?? "", u.referrer ?? "", u.landingPath ?? "", u.signupCountry ?? "",
    new Date(u.createdAt).toLocaleDateString("en-GB"),
    u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString("en-GB") : "Never",
    u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString("en-GB") : "Never",
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
type SortKey = "name" | "email" | "type" | "joined" | "lastSeen" | "sessions";
type SortDir = "asc" | "desc";

/** Most recent of Clerk's lastActiveAt / lastSignInAt (either can lag the other). */
function lastSeen(u: AdminUser): string | null {
  if (u.lastActiveAt && u.lastSignInAt)
    return u.lastActiveAt > u.lastSignInAt ? u.lastActiveAt : u.lastSignInAt;
  return u.lastActiveAt ?? u.lastSignInAt;
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminClient({ users: initialUsers, adminEmail, overview }: { users: AdminUser[]; adminEmail: string; overview: AdminOverview }) {
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
    compPlan: "",       // candidate: "plus" | "professional" · corporate: "team" | "business"
    compDuration: "90", // days: 7 | 30 | 90 | 365
    companyName: "",    // corporate comp only: workspace is pre-created with this name
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
    if (
      (editForm.membership === "team_comp" || editForm.membership === "business_comp") &&
      !editForm.periodEnd
    ) {
      setEditError("Set the trial / subscription end date: it is the complimentary access end date.");
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
              companyCompUntil:
                editForm.accountType === "corporate"
                  ? (billing.companyPlanStatus === "comp" ? periodIso : null)
                  : u.companyCompUntil,
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

  const [activityUserId, setActivityUserId] = useState<string | null>(null);

  function copyId(id: string) {
    void navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  // ── Create user ──────────────────────────────────────────────────────────────

  function openCreate() {
    setCreateForm({ email: "", firstName: "", lastName: "", accountType: "candidate", membership: "free", compPlan: "", compDuration: "90", companyName: "" });
    setCreateError("");
    setCreatedResult(null);
    setResendSent(false);
    setResendError("");
    setShowFallbackUrl(false);
    setCopiedUrl(false);
    setShowCreate(true);
  }

  async function submitCreate() {
    const isCandidate = createForm.accountType === "candidate";
    const isCorporate = createForm.accountType === "corporate";
    if (isCorporate && createForm.compPlan && !createForm.companyName.trim()) {
      setCreateError("Enter a company name: the workspace is created up front for complimentary corporate access.");
      return;
    }
    setCreateLoading(true);
    setCreateError("");
    try {
      const billing = fromMembershipKey(createForm.accountType, createForm.membership);
      const compPlan = (isCandidate || isCorporate) && createForm.compPlan ? createForm.compPlan : null;
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
          ...(isCorporate && compPlan && { companyName: createForm.companyName.trim() }),
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
        compPlan: isCandidate ? compPlan : null,
        compUntil: isCandidate ? compUntil : null,
        companyName: !isCandidate && compPlan ? (createForm.companyName.trim() || null) : null,
        companyRole: !isCandidate && compPlan ? "admin" : null,
        companyPlanId: !isCandidate && compPlan ? compPlan : null,
        companyPlanStatus: !isCandidate && compPlan ? "comp" : null,
        companyPeriodEnd: null,
        companyTrialEndsAt: null,
        companyCompUntil: !isCandidate && compPlan ? compUntil : null,
        trialEndsAt: null,
        trialConsumed: false,
        practiceCount: 0,
        lastPracticeAt: null,
        acCount: 0,
        lastAcAt: null,
        docsCount: 0,
        lastDocAt: null,
        profileComplete: false,
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        promoCode: null,
        referrer: null,
        landingPath: null,
        signupCountry: null,
        createdAt: new Date().toISOString(),
        lastSignInAt: null,
        lastActiveAt: null,
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
      if (sortKey === "sessions") {
        const na = a.practiceCount + a.acCount + a.docsCount;
        const nb = b.practiceCount + b.acCount + b.docsCount;
        return sortDir === "asc" ? na - nb : nb - na;
      }
      const va = sortKey === "name" ? fullName(a) : sortKey === "email" ? a.email : sortKey === "type" ? a.accountType : sortKey === "joined" ? a.createdAt : (lastSeen(a) ?? "");
      const vb = sortKey === "name" ? fullName(b) : sortKey === "email" ? b.email : sortKey === "type" ? b.accountType : sortKey === "joined" ? b.createdAt : (lastSeen(b) ?? "");
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="ml-1 text-gray-400">↕</span>;
    return <span className="ml-1 text-fuchsia-400">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const thS = "pb-3 text-left text-xs font-bold tracking-wide text-gray-400 cursor-pointer select-none hover:text-gray-300 transition whitespace-nowrap";
  const thF = "pb-3 text-left text-xs font-bold tracking-wide text-gray-400 whitespace-nowrap";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0b0918] px-4 py-10 text-white sm:px-8">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
            <span className="rounded-full border border-red-400/30 bg-red-500/10 px-2.5 py-0.5 text-[12px] font-bold text-red-300">Internal only</span>
          </div>
          <p className="mt-1 text-sm text-gray-400">AI Career Mentor · {stats.total} total accounts</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={openCreate} className="shrink-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]">
            + Create user
          </button>
          <button onClick={() => exportCsv(sorted)} className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.09]">
            ↓ Export CSV ({sorted.length})
          </button>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] pl-3 pr-1 py-1">
            <span className="text-xs text-gray-400 hidden sm:inline">{adminEmail}</span>
            <button
              onClick={() => signOut({ redirectUrl: "/admin/sign-in" })}
              className="rounded-full bg-white/[0.07] px-3 py-1.5 text-xs font-bold text-gray-300 transition hover:bg-red-500/20 hover:text-red-300"
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
            <p className="text-xs font-semibold text-gray-400">{label}</p>
            <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Growth + usage overview */}
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {[
          { label: "New users",        value: overview.newUsers7d,     sub: `${overview.newUsers30d} in 30d`,          color: "text-white" },
          { label: "Active users",     value: overview.activeUsers7d,  sub: `${overview.activeUsers30d} in 30d`,       color: "text-emerald-300" },
          { label: "Trials live",      value: overview.trialsActive,   sub: "3-day, no card",                          color: "text-violet-300" },
          { label: "Comp access",      value: overview.compActive,     sub: "guest passes",                            color: "text-cyan-300" },
          { label: "Paying: Plus",     value: overview.payingPlus,     sub: "subscriptions",                           color: "text-emerald-300" },
          { label: "Paying: Pro",      value: overview.payingProfessional, sub: "subscriptions",                       color: "text-emerald-300" },
          { label: "Sessions",         value: overview.sessions7d,     sub: `${overview.sessions30d} in 30d · ${overview.sessionsTotal} all time`, color: "text-fuchsia-300" },
          { label: "AC + career docs", value: overview.ac7d + overview.docs7d, sub: `${overview.acTotal} AC · ${overview.docsTotal} docs all time`, color: "text-amber-300" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold text-gray-400">{label} <span className="text-gray-400">· 7d</span></p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
            <p className="mt-0.5 text-[12px] text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Candidate activation funnel */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
        <p className="text-xs font-semibold text-gray-400">Candidate activation funnel</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {(
            [
              ["Signed up", overview.funnel.signedUp],
              ["Profile built", overview.funnel.profileDone],
              ["Practised", overview.funnel.practised],
              ["Paying", overview.funnel.paying],
            ] as const
          ).map(([label, n], i, arr) => {
            const base = overview.funnel.signedUp || 1;
            const pct = Math.round((n / base) * 100);
            return (
              <span key={label} className="flex items-center gap-2">
                <span className="flex items-baseline gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <span className="text-sm font-bold text-white">{n}</span>
                  <span className="text-[12px] text-gray-400">{label}</span>
                  {i > 0 && <span className="text-[12px] font-bold text-fuchsia-300">{pct}%</span>}
                </span>
                {i < arr.length - 1 && <span className="text-gray-400">→</span>}
              </span>
            );
          })}
        </div>
      </div>

      {/* Acquisition channels + campaign link builder */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
          <p className="text-xs font-semibold text-gray-400">
            Acquisition channels <span className="text-gray-400">· where signups came from</span>
          </p>
          {overview.acquisition.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">
              No attributed signups yet — new signups are tracked from their first visit.
            </p>
          ) : (
            <div className="mt-3 space-y-1.5">
              {overview.acquisition.map(({ channel, total, last30d }) => {
                const max = overview.acquisition[0]?.total || 1;
                return (
                  <div key={channel} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-xs text-gray-300" title={channel}>
                      {channel}
                    </span>
                    <div className="relative h-2 flex-1 rounded-full bg-white/[0.06]">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-fuchsia-400 to-purple-400"
                        style={{ width: `${Math.max(4, Math.round((total / max) * 100))}%` }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs">
                      <span className="font-bold text-white">{total}</span>
                      <span className="text-gray-400"> · {last30d} 30d</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <CampaignLinkBuilder />
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Search name, email or company…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder:text-gray-400 focus:border-fuchsia-400/40 focus:outline-none"
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
              <th className={thS} onClick={() => toggleSort("sessions")} title="Practice sessions · assessment centres · career docs">Usage <SortIcon k="sessions" /></th>
              <th className={thF} title="Where this signup came from (first visit)">Source</th>
              <th className={thS} onClick={() => toggleSort("joined")}>Joined <SortIcon k="joined" /></th>
              <th className={thS} onClick={() => toggleSort("lastSeen")}>Last active <SortIcon k="lastSeen" /></th>
              <th className={thF} style={{ paddingRight: "1.5rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {pageData.length === 0 && (
              <tr><td colSpan={10} className="py-16 text-center text-gray-400">No users match your filters.</td></tr>
            )}
            {pageData.map((u) => (
              <tr key={u.id} className="group transition hover:bg-white/[0.03]">
                {/* User */}
                <td className="py-3.5 pl-6 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/20 text-xs font-bold text-fuchsia-300">{initials(u)}</div>
                    <div>
                      <p className="font-bold leading-tight text-white">{fullName(u)}</p>
                      <p className="text-[12px] text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 pr-4"><TypeBadge type={u.accountType} /></td>
                <td className="py-3.5 pr-4"><MembershipBadge user={u} /></td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-gray-400">
                  {u.companyName ?? "–"}
                  {u.companyRole && <span className="ml-1 text-[12px] capitalize text-gray-400">({u.companyRole})</span>}
                </td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-[12px] text-gray-400">{getPeriodEnd(u) ? fmtDate(getPeriodEnd(u)) : "–"}</td>
                {/* Usage: sessions · assessment centres · career docs */}
                <td className="whitespace-nowrap py-3.5 pr-4">
                  {u.accountType === "candidate" ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold">
                      <span className={u.practiceCount > 0 ? "rounded-md bg-fuchsia-500/15 px-1.5 py-0.5 text-fuchsia-300" : "rounded-md bg-white/[0.04] px-1.5 py-0.5 text-gray-400"} title={`${u.practiceCount} practice sessions${u.lastPracticeAt ? ` · last ${fmtDate(u.lastPracticeAt)}` : ""}`}>
                        {u.practiceCount}S
                      </span>
                      <span className={u.acCount > 0 ? "rounded-md bg-amber-500/15 px-1.5 py-0.5 text-amber-300" : "rounded-md bg-white/[0.04] px-1.5 py-0.5 text-gray-400"} title={`${u.acCount} assessment centres${u.lastAcAt ? ` · last ${fmtDate(u.lastAcAt)}` : ""}`}>
                        {u.acCount}AC
                      </span>
                      <span className={u.docsCount > 0 ? "rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-cyan-300" : "rounded-md bg-white/[0.04] px-1.5 py-0.5 text-gray-400"} title={`${u.docsCount} career docs${u.lastDocAt ? ` · last ${fmtDate(u.lastDocAt)}` : ""}`}>
                        {u.docsCount}D
                      </span>
                      {!u.profileComplete && (
                        <span className="ml-0.5 text-[12px] text-gray-400" title="No candidate profile saved yet">no profile</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-[12px] text-gray-400">–</span>
                  )}
                </td>
                {/* Acquisition source */}
                <td className="whitespace-nowrap py-3.5 pr-4">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[12px] font-bold ${
                      u.utmSource || u.promoCode || u.referrer
                        ? "bg-violet-500/15 text-violet-300"
                        : "bg-white/[0.04] text-gray-400"
                    }`}
                    title={[
                      u.utmCampaign ? `Campaign: ${u.utmCampaign}` : null,
                      u.referrer ? `Referrer: ${u.referrer}` : null,
                      u.landingPath ? `Landed on: ${u.landingPath}` : null,
                      u.signupCountry ? `Country: ${u.signupCountry}` : null,
                    ]
                      .filter(Boolean)
                      .join("\n") || "No attribution captured (signed up before tracking, or direct visit)"}
                  >
                    {deriveChannel(u)}
                  </span>
                </td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-[12px] text-gray-400">{fmtDate(u.createdAt)}</td>
                <td className="whitespace-nowrap py-3.5 pr-4 text-[12px] text-gray-400">{fmtDate(lastSeen(u))}</td>
                {/* Actions */}
                <td className="py-3.5 pr-6">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActivityUserId(u.id)}
                      title="Full behavioural report: visits, journey, drop-off point"
                      className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[12px] font-bold text-cyan-300 transition hover:bg-cyan-500/20"
                    >
                      Activity
                    </button>
                    <button
                      onClick={() => openEdit(u)}
                      className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1 text-[12px] font-bold text-fuchsia-300 transition hover:bg-fuchsia-500/20"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDelete(u)}
                      className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-[12px] font-bold text-red-300 transition hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => copyId(u.id)}
                      className="rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1 text-[12px] font-bold text-gray-400 transition hover:border-white/20 hover:text-gray-300"
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
          <p className="text-xs text-gray-400">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-white transition hover:bg-white/[0.09] disabled:opacity-30">← Prev</button>
            <span className="flex items-center px-3 text-sm text-gray-400">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-white transition hover:bg-white/[0.09] disabled:opacity-30">Next →</button>
          </div>
        </div>
      )}

      <p className="mt-10 text-center text-[12px] text-gray-700">AI Career Mentor · Internal admin · Not indexed · Not linked from any public page</p>

      {/* ── Per-user activity drill-down ─────────────────────────────────────────── */}
      {activityUserId && (
        <UserActivityPanel
          userId={activityUserId}
          onClose={() => setActivityUserId(null)}
        />
      )}

      {/* ── Create user modal ────────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-sm px-4 py-20" onClick={() => { if (!createLoading) { setShowCreate(false); setCreatedResult(null); } }}>
          <div className="w-full max-w-md rounded-[1.75rem] border border-fuchsia-400/20 bg-[#120a1e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[12px] font-bold tracking-wide text-fuchsia-300">Create user</p>
            <h3 className="mt-1 text-xl font-bold text-white">New account</h3>

            {createdResult ? (
              /* ── Success state ─────────────────────── */
              <div className="mt-5 space-y-3">

                {/* Account created */}
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.07] px-4 py-3">
                  <svg className="h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <div>
                    <p className="text-sm font-bold text-emerald-300">Account created</p>
                    <p className="text-[12px] text-emerald-200/60">{createdResult.email}</p>
                  </div>
                </div>

                {/* Email status */}
                {createdResult.emailSent && !resendSent && (
                  <div className="flex items-center gap-3 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/[0.07] px-4 py-3">
                    <svg className="h-4 w-4 shrink-0 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <p className="text-sm font-bold text-fuchsia-300">Sign-in link emailed to {createdResult.email}</p>
                  </div>
                )}

                {resendSent && (
                  <div className="flex items-center gap-3 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/[0.07] px-4 py-3">
                    <svg className="h-4 w-4 shrink-0 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <p className="text-sm font-bold text-fuchsia-300">Email resent to {createdResult.email}</p>
                  </div>
                )}

                {/* Email failed — hard-to-miss error + auto-show fallback */}
                {!createdResult.emailSent && !resendSent && (
                  <div className="rounded-2xl border border-red-400/30 bg-red-500/[0.08] px-4 py-3">
                    <p className="text-sm font-bold text-red-300">⚠ Email could not be sent</p>
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
                      className="w-full rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 py-2.5 text-sm font-bold text-fuchsia-300 transition hover:bg-fuchsia-500/20 disabled:opacity-50"
                    >
                      {resendLoading ? "Sending…" : createdResult.emailSent ? "Resend email" : "Try sending email again"}
                    </button>
                  </div>
                )}

                {/* Fallback: copy link manually */}
                <div>
                  <button
                    onClick={() => setShowFallbackUrl((v) => !v)}
                    className="text-[12px] text-gray-400 hover:text-gray-300 transition"
                  >
                    {showFallbackUrl ? "Hide" : "Or copy sign-in link manually ↓"}
                  </button>
                  {showFallbackUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        readOnly
                        value={createdResult.signInUrl}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[12px] text-fuchsia-300 focus:outline-none truncate"
                      />
                      <button
                        onClick={() => copyFallbackUrl(createdResult.signInUrl)}
                        className="shrink-0 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[12px] font-bold text-gray-300 transition hover:bg-white/10"
                      >
                        {copiedUrl ? "✓" : "Copy"}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setShowCreate(false); setCreatedResult(null); }}
                  className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.08]"
                >
                  Done
                </button>
              </div>
            ) : (
              /* ── Form state ────────────────────────── */
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-bold tracking-wide text-gray-400">Email address <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                    disabled={createLoading}
                    placeholder="user@example.com"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-400 focus:border-fuchsia-400/40 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold tracking-wide text-gray-400">First name</label>
                    <input
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                      disabled={createLoading}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-400 focus:border-fuchsia-400/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold tracking-wide text-gray-400">Last name</label>
                    <input
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                      disabled={createLoading}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-400 focus:border-fuchsia-400/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold tracking-wide text-gray-400">Account type <span className="text-red-400">*</span></label>
                  <select
                    value={createForm.accountType}
                    onChange={(e) => setCreateForm((f) => ({ ...f, accountType: e.target.value, membership: (e.target.value === "corporate" ? "none" : "free") as MembershipKey, compPlan: "", companyName: "" }))}
                    disabled={createLoading}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none"
                  >
                    <option value="candidate">Candidate</option>
                    <option value="corporate">Corporate</option>
                    <option value="university">University</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold tracking-wide text-gray-400">Membership</label>
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
                    <p className="mt-1.5 text-[12px] text-gray-400">
                      {createForm.compPlan
                        ? "Locked to Free while complimentary access is set. Guests must not look like paying subscribers."
                        : "Membership = a real paid subscription. For invited guests leave this on Free and use complimentary access below."}
                    </p>
                  )}
                </div>

                {/* Complimentary access — candidates and corporate */}
                {(createForm.accountType === "candidate" || createForm.accountType === "corporate") && (
                  <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3.5">
                    <label className="block text-[12px] font-bold tracking-wide text-cyan-300">Complimentary access</label>
                    <p className="mt-1 text-[12px] leading-4 text-gray-400">
                      {createForm.accountType === "corporate"
                        ? "Guest workspace with no card and no Stripe. The company is created up front, expires automatically, and there is nothing to cancel."
                        : "Guest access with no card and no Stripe. Expires automatically, then the account returns to Free with nothing to cancel."}
                    </p>
                    <div className="mt-2.5 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-bold tracking-wide text-gray-400">Plan</label>
                        <select
                          value={createForm.compPlan}
                          onChange={(e) => setCreateForm((f) => ({
                            ...f,
                            compPlan: e.target.value,
                            ...(e.target.value
                              ? { membership: (f.accountType === "corporate" ? "none" : "free") as MembershipKey }
                              : {}),
                          }))}
                          disabled={createLoading || (createForm.accountType === "candidate" ? createForm.membership !== "free" : createForm.membership !== "none")}
                          className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0918] px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none disabled:opacity-40"
                        >
                          <option value="">None</option>
                          {createForm.accountType === "corporate" ? (
                            <>
                              <option value="team">Team</option>
                              <option value="business">Business</option>
                            </>
                          ) : (
                            <>
                              <option value="plus">Plus</option>
                              <option value="professional">Professional</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold tracking-wide text-gray-400">Duration</label>
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
                    {createForm.accountType === "corporate" && createForm.compPlan && (
                      <div className="mt-3">
                        <label className="block text-[12px] font-bold tracking-wide text-gray-400">Company name <span className="text-red-400">*</span></label>
                        <input
                          value={createForm.companyName}
                          onChange={(e) => setCreateForm((f) => ({ ...f, companyName: e.target.value }))}
                          disabled={createLoading}
                          placeholder="Acme Corp"
                          className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-400 focus:border-cyan-400/40 focus:outline-none"
                        />
                        <p className="mt-1.5 text-[12px] text-gray-400">The workspace is created immediately with this person as its admin, so they land straight on a ready dashboard.</p>
                      </div>
                    )}
                  </div>
                )}

                {createError && <p className="text-sm font-semibold text-red-300">{createError}</p>}

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowCreate(false)} disabled={createLoading} className="flex-1 rounded-full border border-white/10 bg-white/[0.04] py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.08] disabled:opacity-50">Cancel</button>
                  <button
                    onClick={() => void submitCreate()}
                    disabled={createLoading || !createForm.email.trim()}
                    className="flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-60"
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
            <p className="text-[12px] font-bold tracking-wide text-fuchsia-300">Edit user</p>
            <h3 className="mt-1 text-xl font-bold text-white">{editingUser.email}</h3>
            <p className="mt-0.5 text-[12px] text-gray-400">Clerk ID: {editingUser.id}</p>

            {/* Usage snapshot (read-only) */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
              <p className="text-[12px] font-bold tracking-wide text-gray-400">Usage</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                {(
                  [
                    ["Sessions", editingUser.practiceCount, editingUser.lastPracticeAt],
                    ["Assess. centres", editingUser.acCount, editingUser.lastAcAt],
                    ["Career docs", editingUser.docsCount, editingUser.lastDocAt],
                  ] as const
                ).map(([label, n, last]) => (
                  <div key={label} className="rounded-xl bg-black/30 px-2 py-2">
                    <p className="text-lg font-bold text-white">{n}</p>
                    <p className="text-[12px] text-gray-400">{label}</p>
                    <p className="text-[12px] text-gray-400">{last ? `last ${fmtDate(last)}` : "never"}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-gray-400">
                <span>Profile: <span className={editingUser.profileComplete ? "text-emerald-300" : "text-gray-400"}>{editingUser.profileComplete ? "built" : "not built"}</span></span>
                <span>Joined {fmtDate(editingUser.createdAt)}</span>
                <span>Last sign-in {fmtDate(editingUser.lastSignInAt)}</span>
                <span>Last active {fmtDate(lastSeen(editingUser))}</span>
                {editingUser.trialConsumed && (
                  <span>
                    Trial{" "}
                    {editingUser.trialEndsAt && new Date(editingUser.trialEndsAt).getTime() > Date.now()
                      ? `active until ${fmtDate(editingUser.trialEndsAt)}`
                      : "used"}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold tracking-wide text-gray-400">First name</label>
                  <input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                    disabled={editLoading}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-400 focus:border-fuchsia-400/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold tracking-wide text-gray-400">Last name</label>
                  <input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                    disabled={editLoading}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-400 focus:border-fuchsia-400/40 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-wide text-gray-400">Account type</label>
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
                <p className="mt-1.5 text-[12px] text-amber-400/80">⚠ Changing account type affects which part of the site they can access.</p>
              </div>

              {/* Membership — options adapt to account type */}
              <div>
                <label className="block text-[12px] font-bold tracking-wide text-gray-400">Membership</label>
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
                      <option value="team_comp">Team (Complimentary)</option>
                      <option value="team">Team</option>
                      <option value="business_trial">Business (Trial)</option>
                      <option value="business_comp">Business (Complimentary)</option>
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
                  <p className="mt-1.5 text-[12px] text-gray-400">Affects all members of this company workspace.</p>
                )}
                {editForm.accountType === "candidate" && !!editForm.compPlan && (
                  <p className="mt-1.5 text-[12px] text-gray-400">Locked to Free while complimentary access is set. Remove the complimentary plan first to set a paid membership manually.</p>
                )}
              </div>

              {/* Company name — corporate only */}
              {editForm.accountType === "corporate" && (
                <div>
                  <label className="block text-[12px] font-bold tracking-wide text-gray-400">Company name</label>
                  <input
                    value={editForm.companyName}
                    onChange={(e) => setEditForm((f) => ({ ...f, companyName: e.target.value }))}
                    disabled={editLoading}
                    placeholder="Acme Corp"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-400 focus:border-fuchsia-400/40 focus:outline-none"
                  />
                </div>
              )}

              {/* Period end */}
              <div>
                <label className="block text-[12px] font-bold tracking-wide text-gray-400">
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
                  <label className="block text-[12px] font-bold tracking-wide text-cyan-300">Complimentary access</label>
                  <p className="mt-1 text-[12px] leading-4 text-gray-400">
                    Guest access with no card and no Stripe. It expires automatically on the end date, then the user returns to Free with nothing to cancel. A paid subscription always takes precedence.
                  </p>
                  <div className="mt-2.5 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-bold tracking-wide text-gray-400">Plan</label>
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
                      <label className="block text-[12px] font-bold tracking-wide text-gray-400">Until</label>
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
                  <label className="block text-[12px] font-bold tracking-wide text-gray-400">Joined</label>
                  <p className="mt-1.5 px-3 py-2.5 text-sm text-gray-400">{fmtDate(editingUser.createdAt)}</p>
                </div>
              )}

              {editError && <p className="text-sm font-semibold text-red-300">{editError}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditingUser(null)} disabled={editLoading} className="flex-1 rounded-full border border-white/10 bg-white/[0.04] py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.08] disabled:opacity-50">Cancel</button>
                <button onClick={() => void saveEdit()} disabled={editLoading} className="flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-60">
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
            <p className="text-[12px] font-bold tracking-wide text-red-300">Delete account</p>
            <h3 className="mt-1 text-xl font-bold text-white">{fullName(deletingUser)}</h3>
            <p className="mt-0.5 text-sm text-gray-400">{deletingUser.email}</p>

            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-xs leading-5 text-red-200/80">
              This permanently deletes their Clerk account and removes them from any company workspace.
              Their practice session data and assessment results will remain in the database.
              <strong className="block mt-1 text-red-200">This cannot be undone.</strong>
            </div>

            <label className="mt-4 block text-[12px] font-bold tracking-wide text-gray-400">
              Type their email to confirm
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError(""); }}
              disabled={deleteLoading}
              placeholder={deletingUser.email}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-400 focus:border-red-400/40 focus:outline-none"
            />

            {deleteError && <p className="mt-2 text-sm font-semibold text-red-300">{deleteError}</p>}

            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeletingUser(null)} disabled={deleteLoading} className="flex-1 rounded-full border border-white/10 bg-white/[0.04] py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.08] disabled:opacity-50">Cancel</button>
              <button
                onClick={() => void confirmDelete()}
                disabled={deleteLoading || deleteConfirm.trim() !== deletingUser.email}
                className="flex-1 rounded-full bg-red-600/90 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
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

// ── Campaign link builder ─────────────────────────────────────────────────────

const LINK_PRESETS: Array<{ label: string; source: string; medium: string; campaign: string }> = [
  { label: "The Student Room", source: "tsr",      medium: "community", campaign: "launch" },
  { label: "Reddit",           source: "reddit",   medium: "community", campaign: "launch" },
  { label: "TikTok",           source: "tiktok",   medium: "social",    campaign: "launch" },
  { label: "LinkedIn",         source: "linkedin", medium: "social",    campaign: "launch" },
  { label: "University pilot", source: "uni",      medium: "partner",   campaign: "pilot" },
  { label: "Google Ads",       source: "google",   medium: "cpc",       campaign: "search" },
];

/**
 * Builds UTM-tagged links so every channel post/ad can be traced back in the
 * Acquisition card. Client-side only — nothing is stored.
 */
function CampaignLinkBuilder() {
  const [source, setSource] = useState("tsr");
  const [medium, setMedium] = useState("community");
  const [campaign, setCampaign] = useState("launch");
  const [path, setPath] = useState("/");
  const [copied, setCopied] = useState("");

  const buildUrl = (s: string, m: string, c: string, p: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const cleanPath = p.startsWith("/") ? p : `/${p}`;
    const params = new URLSearchParams();
    if (s.trim()) params.set("utm_source", s.trim().toLowerCase());
    if (m.trim()) params.set("utm_medium", m.trim().toLowerCase());
    if (c.trim()) params.set("utm_campaign", c.trim().toLowerCase());
    const qs = params.toString();
    return `${origin}${cleanPath}${qs ? `?${qs}` : ""}`;
  };

  const copy = async (url: string, key: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      // Clipboard unavailable — the URL is visible to copy manually.
    }
  };

  const customUrl = buildUrl(source, medium, campaign, path);
  const inputS =
    "w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white placeholder:text-gray-400 focus:border-fuchsia-400/40 focus:outline-none";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
      <p className="text-xs font-semibold text-gray-400">
        Campaign link builder <span className="text-gray-400">· tag links so signups are traceable</span>
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-[12px] uppercase tracking-wider text-gray-400">Source</span>
          <input value={source} onChange={(e) => setSource(e.target.value)} className={inputS} placeholder="tiktok" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] uppercase tracking-wider text-gray-400">Medium</span>
          <input value={medium} onChange={(e) => setMedium(e.target.value)} className={inputS} placeholder="social" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] uppercase tracking-wider text-gray-400">Campaign</span>
          <input value={campaign} onChange={(e) => setCampaign(e.target.value)} className={inputS} placeholder="launch" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] uppercase tracking-wider text-gray-400">Page</span>
          <input value={path} onChange={(e) => setPath(e.target.value)} className={inputS} placeholder="/" />
        </label>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[12px] text-fuchsia-200" title={customUrl}>
          {customUrl}
        </code>
        <button
          onClick={() => void copy(customUrl, "custom")}
          className="shrink-0 rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1.5 text-[12px] font-bold text-fuchsia-300 transition hover:bg-fuchsia-500/20"
        >
          {copied === "custom" ? "Copied ✓" : "Copy"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {LINK_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => void copy(buildUrl(p.source, p.medium, p.campaign, "/"), p.label)}
            title={buildUrl(p.source, p.medium, p.campaign, "/")}
            className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[12px] font-bold text-gray-300 transition hover:border-fuchsia-400/30 hover:text-white"
          >
            {copied === p.label ? "Copied ✓" : p.label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-[12px] leading-4 text-gray-400">
        Preset buttons copy a homepage link tagged for that channel. Links with a promo code
        (e.g. ?promo=SUMMER2026) are tracked automatically as promo signups.
      </p>
    </div>
  );
}
