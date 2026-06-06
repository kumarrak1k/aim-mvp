"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";
import {
  getPlan,
  isPlanActive,
  trialDaysRemaining,
  CORPORATE_TRIAL_INVITE_CAP,
} from "@/app/lib/corporatePlan";

type Assignment = {
  id: string;
  candidateEmail: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  template: { id: string; name: string; role: string };
};

type Template = {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  _count: { assignments: number };
};

type TeamMember = {
  id: string;
  clerkUserId: string;
  role: string;
  createdAt: string;
};

type CompanyData = {
  company: {
    id: string;
    name: string;
    industry: string | null;
    brandColor: string;
    planId: string | null;
    planStatus: string;
    trialEndsAt: string | null;
    trialInvitesUsed: number;
    _count: { members: number; templates: number; assignments: number };
  };
  member: { id: string; role: string };
} | null;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-400/15 text-yellow-200 border-yellow-400/25",
  started: "bg-blue-400/15 text-blue-200 border-blue-400/25",
  completed: "bg-green-400/15 text-green-200 border-green-400/25",
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get("payment"); // "success" | "cancelled" | null
  const [data, setData] = useState<CompanyData>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<{ id: string; email: string; role: string; token: string; expiresAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // Billing action state
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState("");

  // Member invite modal state
  const [showMemberInviteModal, setShowMemberInviteModal] = useState(false);
  const [memberInviteEmail, setMemberInviteEmail] = useState("");
  const [memberInviteRole, setMemberInviteRole] = useState<"recruiter" | "admin" | "viewer">("recruiter");
  const [memberInviteLoading, setMemberInviteLoading] = useState(false);
  const [memberInviteError, setMemberInviteError] = useState("");
  const [memberInviteLink, setMemberInviteLink] = useState("");

  // Delete-workspace state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // Account-type guard — candidates who reach this URL get sent home.
        const typeRes = await fetch("/api/account-type");
        if (typeRes.ok) {
          const { accountType } = await typeRes.json() as { accountType?: string };
          if (accountType === "candidate") {
            router.replace("/practice");
            return;
          }
        }

        const [companyRes, assignmentsRes, templatesRes, membersRes] = await Promise.all([
          fetch("/api/company"),
          fetch("/api/company/assignments"),
          fetch("/api/company/templates"),
          fetch("/api/company/members"),
        ]);
        const companyData = await companyRes.json();
        if (!companyData.company) { router.push("/company/setup"); return; }
        setData(companyData);
        const aData = await assignmentsRes.json();
        setAssignments(aData.assignments || []);
        const tData = await templatesRes.json();
        setTemplates(tData.templates || []);
        const mData = await membersRes.json();
        setMembers(mData.members || []);
        setPendingInvites(mData.invites || []);
      } catch {
        // noop
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <CorporateAppShell currentPath="/company/dashboard">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
        </div>
      </CorporateAppShell>
    );
  }

  async function removeMember(memberId: string) {
    setRemovingMemberId(memberId);
    try {
      const res = await fetch("/api/company/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } finally {
      setRemovingMemberId(null);
    }
  }

  async function sendMemberInvite() {
    setMemberInviteLoading(true);
    setMemberInviteError("");
    try {
      const res = await fetch("/api/company/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: memberInviteEmail.trim(), role: memberInviteRole }),
      });
      const json = await res.json();
      if (!res.ok || !json.invite) {
        setMemberInviteError(json.error || "Failed to create invite. Please try again.");
        return;
      }
      const link = `${window.location.origin}/company/join/${json.invite.token}`;
      setMemberInviteLink(link);
      setPendingInvites((prev) => [...prev, json.invite]);
      setMemberInviteEmail("");
    } catch {
      setMemberInviteError("Network error. Please try again.");
    } finally {
      setMemberInviteLoading(false);
    }
  }

  async function startCheckout(billing: "monthly" | "annual" = "monthly") {
    setBillingLoading(true);
    setBillingError("");
    try {
      const res = await fetch("/api/company/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billing }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setBillingError(json.error || "Could not start checkout. Please try again.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setBillingError("Network error. Please try again.");
    } finally {
      setBillingLoading(false);
    }
  }

  async function openBillingPortal() {
    setBillingLoading(true);
    setBillingError("");
    try {
      const res = await fetch("/api/company/billing-portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setBillingError(json.error || "Could not open billing portal. Please try again.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setBillingError("Network error. Please try again.");
    } finally {
      setBillingLoading(false);
    }
  }

  if (!data) return null;

  const { company, member } = data;
  const recentAssignments = assignments.slice(0, 8);
  const activeTemplates = templates.filter((t) => t.isActive).length;
  const completedCount = assignments.filter((a) => a.status === "completed").length;
  const pendingCount = assignments.filter((a) => a.status === "pending").length;

  // Plan & trial helpers
  const plan = getPlan(company.planId);
  const planActive = isPlanActive({ planStatus: company.planStatus, trialEndsAt: company.trialEndsAt });
  const daysLeft = trialDaysRemaining(company.trialEndsAt);
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const invitesThisMonth = assignments.filter((a) => new Date(a.createdAt) >= thisMonthStart).length;

  return (
    <CorporateAppShell currentPath="/company/dashboard">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-fuchsia-300">Company Dashboard</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] sm:text-4xl">{company.name}</h1>
            {company.industry && <p className="mt-1 text-sm text-gray-400">{company.industry}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            {member.role !== "viewer" && (
              <Link href="/company/templates/new">
                <button className="rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]">
                  + New template
                </button>
              </Link>
            )}
            <Link href="/company/candidates">
              <button className="rounded-full border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.09]">
                Invite candidate
              </button>
            </Link>
          </div>
        </div>

        {/* Payment success / cancelled flash */}
        {paymentResult === "success" && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] px-5 py-4">
            <span className="text-xl">🎉</span>
            <div>
              <p className="text-sm font-black text-emerald-200">Payment confirmed — welcome to {plan?.name ?? "your plan"}!</p>
              <p className="mt-0.5 text-xs text-emerald-200/70">Your workspace is fully activated. Start sending candidate invites.</p>
            </div>
          </div>
        )}

        {/* Billing error */}
        {billingError && (
          <div className="mb-8 rounded-2xl border border-red-400/25 bg-red-400/[0.07] px-5 py-4">
            <p className="text-sm font-semibold text-red-200">{billingError}</p>
          </div>
        )}

        {/* Plan / trial banner */}
        {company.planStatus === "none" && (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-amber-200">No active plan</p>
              <p className="mt-0.5 text-xs text-amber-200/70">Choose a plan to send invites and create templates. Viewing existing data is unaffected.</p>
            </div>
            <Link href="/company/plan">
              <button className="shrink-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]">
                Choose a plan →
              </button>
            </Link>
          </div>
        )}
        {company.planStatus === "trial" && planActive && (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-fuchsia-200">
                {plan?.name} plan — free trial · {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
              </p>
              <p className="mt-0.5 text-xs text-fuchsia-200/70">
                Full access until your trial ends ·{" "}
                {Math.min(company.trialInvitesUsed ?? 0, CORPORATE_TRIAL_INVITE_CAP)} of{" "}
                {CORPORATE_TRIAL_INVITE_CAP} trial invites used. Add a payment method to avoid interruption.
              </p>
            </div>
            {member.role === "admin" && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  onClick={() => void startCheckout("monthly")}
                  disabled={billingLoading}
                  className="rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-60"
                >
                  {billingLoading ? "Loading…" : "Upgrade — monthly"}
                </button>
                <button
                  onClick={() => void startCheckout("annual")}
                  disabled={billingLoading}
                  className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-5 py-2.5 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-500/20 disabled:opacity-60"
                >
                  Annual · save 2 months
                </button>
              </div>
            )}
          </div>
        )}
        {((company.planStatus === "trial" && !planActive) || company.planStatus === "expired" || company.planStatus === "cancelled") && (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-red-400/25 bg-red-400/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-red-200">
                {company.planStatus === "cancelled" ? "Subscription cancelled" : "Your trial has ended"}
              </p>
              <p className="mt-0.5 text-xs text-red-200/70">You can view existing data but cannot send invites or create templates until you upgrade.</p>
            </div>
            {member.role === "admin" && (
              <button
                onClick={() => void startCheckout()}
                disabled={billingLoading}
                className="shrink-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-60"
              >
                {billingLoading ? "Loading…" : "Upgrade now →"}
              </button>
            )}
          </div>
        )}
        {company.planStatus === "active" && (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-emerald-200">
                {plan?.name ?? "Active"} plan — paid
              </p>
              <p className="mt-0.5 text-xs text-emerald-200/70">Your workspace is fully active. Manage invoices, payment method or cancel in the billing portal.</p>
            </div>
            {member.role === "admin" && (
              <button
                onClick={() => void openBillingPortal()}
                disabled={billingLoading}
                className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-black text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-60"
              >
                {billingLoading ? "Loading…" : "Manage billing →"}
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: plan ? `Team members (${company._count.members}/${plan.seats} seats)` : "Team members",
              value: company._count.members,
              color: "text-fuchsia-300",
            },
            { label: "Active templates", value: activeTemplates, color: "text-purple-300" },
            company.planStatus === "trial"
              ? {
                  label: `Trial invites (${Math.min(company.trialInvitesUsed ?? 0, CORPORATE_TRIAL_INVITE_CAP)}/${CORPORATE_TRIAL_INVITE_CAP})`,
                  value: company.trialInvitesUsed ?? 0,
                  color: "text-cyan-300",
                }
              : {
                  label: plan ? `Invites this month (${invitesThisMonth}/${plan.invitesPerMonth})` : "Total invites sent",
                  value: plan ? invitesThisMonth : company._count.assignments,
                  color: "text-cyan-300",
                },
            { label: "Completed assessments", value: completedCount, color: "text-green-300" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
              <p className="text-sm font-semibold text-gray-400">{label}</p>
              <p className={`mt-2 text-4xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/company/templates", label: "Assessment templates", desc: `${activeTemplates} active`, icon: "📋" },
            { href: "/company/candidates", label: "Candidates", desc: `${pendingCount} awaiting`, icon: "👥" },
            { href: "/company/results", label: "Results & scoring", desc: `${completedCount} completed`, icon: "📊" },
            { href: "#team", label: "Team & settings", desc: `${company._count.members} member${company._count.members === 1 ? "" : "s"}`, icon: "⚙️" },
          ].map(({ href, label, desc, icon }) => (
            <Link key={href} href={href}>
              <div className="group rounded-2xl border border-white/10 bg-white/[0.05] p-6 transition hover:bg-white/[0.08]">
                <div className="mb-3 text-2xl">{icon}</div>
                <p className="font-black text-white">{label}</p>
                <p className="mt-1 text-sm text-gray-400">{desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Team member management — admin only */}
        {member.role === "admin" && (
          <div id="team" className="mb-10 scroll-mt-24 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/10">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Team members</h2>
                {plan && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {members.length} of {plan.seats} seats used
                  </p>
                )}
              </div>
              {planActive && plan && members.length < plan.seats && (
                <button
                  onClick={() => { setMemberInviteLink(""); setMemberInviteError(""); setShowMemberInviteModal(true); }}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-black text-white transition hover:bg-white/[0.09]"
                >
                  + Invite member
                </button>
              )}
            </div>
            {planActive && plan && members.length >= plan.seats && (
              <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                You've reached your {plan.seats}-seat limit. Remove a member, or{" "}
                <a href="/company/plan" className="font-black underline">upgrade your plan</a> to add more recruiters.
              </p>
            )}
            <div className="divide-y divide-white/[0.06]">
              {members.map((m) => {
                // Find the current user's own member record to detect "you"
                const myMember = members.find((x) => x.id === member.id);
                const isYou = myMember ? m.id === myMember.id : false;
                return (
                  <div key={m.id} className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/20 text-xs font-black text-fuchsia-300">
                        {m.role === "admin" ? "A" : "R"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                          {isYou && <span className="ml-2 text-xs font-semibold text-gray-500">(you)</span>}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Joined {new Date(m.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    {!isYou && (
                      <button
                        onClick={() => void removeMember(m.id)}
                        disabled={removingMemberId === m.id}
                        className="rounded-full border border-red-400/25 bg-red-400/[0.07] px-3.5 py-1.5 text-xs font-black text-red-300 transition hover:bg-red-400/[0.14] disabled:opacity-50"
                      >
                        {removingMemberId === m.id ? "Removing…" : "Remove"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pending invites */}
            {pendingInvites.length > 0 && (
              <div className="mt-5 border-t border-white/[0.06] pt-5">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-gray-500">Pending invites</p>
                <div className="space-y-2">
                  {pendingInvites.map((inv) => {
                    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/company/join/${inv.token}`;
                    return (
                      <div key={inv.id} className="flex flex-col gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{inv.email}</p>
                          <p className="text-[11px] text-gray-500 capitalize">{inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                        </div>
                        <button
                          onClick={() => void navigator.clipboard.writeText(link)}
                          className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-xs font-black text-gray-300 transition hover:bg-white/[0.09]"
                        >
                          Copy invite link
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {members.length === 0 && pendingInvites.length === 0 && (
              <p className="py-4 text-sm text-gray-500">No team members yet.</p>
            )}
          </div>
        )}

        {/* Danger zone — admin only */}
        {member.role === "admin" && (
          <div className="mb-10 overflow-hidden rounded-[2rem] border border-red-500/25 bg-red-500/[0.04] p-6 shadow-xl shadow-black/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-red-300">
                  Danger zone
                </p>
                <h2 className="mt-2 text-lg font-black tracking-[-0.03em] text-white">
                  Delete this workspace
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-400">
                  Permanently removes <span className="font-black text-white">{company.name}</span>{" "}
                  along with every template, assignment, invite and team member.
                  Candidates&rsquo; personal practice sessions are not affected.
                  This cannot be undone.
                </p>
              </div>
              <button
                onClick={() => {
                  setDeleteError("");
                  setDeleteConfirmName("");
                  setShowDeleteModal(true);
                }}
                className="shrink-0 rounded-full border border-red-400/40 bg-red-500/10 px-5 py-2.5 text-sm font-black text-red-200 transition hover:bg-red-500/20"
              >
                Delete workspace
              </button>
            </div>
          </div>
        )}

        {/* Recent assignments */}
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-black">Recent assessments</h2>
            <Link href="/company/candidates" className="text-sm font-black text-fuchsia-300 hover:text-fuchsia-200">
              View all →
            </Link>
          </div>

          {recentAssignments.length === 0 ? (
            <div className="py-10">
              <p className="text-center text-gray-300">
                {templates.length === 0
                  ? "Welcome! Here's how to start assessing candidates:"
                  : "No assessments yet — invite your first candidate to get started."}
              </p>
              <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
                {[
                  { n: "1", t: "Build a template", d: "Pick the role, type and stages once." },
                  { n: "2", t: "Invite candidates", d: "Share a link — they complete it at their own pace." },
                  { n: "3", t: "Review results", d: "Compare AI-scored, ranked candidates." },
                ].map((s) => (
                  <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                    <p className="text-2xl font-black text-fuchsia-300">{s.n}</p>
                    <p className="mt-1 text-sm font-bold">{s.t}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">{s.d}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <Link href={templates.length === 0 ? "/company/templates/new" : "/company/candidates"}>
                  <button className="rounded-full bg-fuchsia-500/20 px-5 py-2.5 text-sm font-black text-fuchsia-200 transition hover:bg-fuchsia-500/30">
                    {templates.length === 0 ? "Create your first template →" : "Send your first invite →"}
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-3 text-left font-black text-gray-400">Candidate</th>
                    <th className="pb-3 text-left font-black text-gray-400">Template</th>
                    <th className="pb-3 text-left font-black text-gray-400">Status</th>
                    <th className="pb-3 text-left font-black text-gray-400">Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentAssignments.map((a) => (
                    <tr key={a.id}>
                      <td className="py-3 font-semibold text-white">{a.candidateEmail}</td>
                      <td className="py-3 text-gray-300">{a.template.name}</td>
                      <td className="py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-black capitalize ${STATUS_COLORS[a.status] || "bg-white/5 text-gray-300 border-white/10"}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400">
                        {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invite team member modal */}
      {showMemberInviteModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm px-4 py-16"
          onClick={() => { if (!memberInviteLoading) { setShowMemberInviteModal(false); setMemberInviteLink(""); } }}
        >
          <div
            className="w-full max-w-md rounded-[1.75rem] border border-fuchsia-400/20 bg-[#120a1e] p-6 shadow-2xl shadow-fuchsia-950/40"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-fuchsia-300">Invite team member</p>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">Add to your workspace</h3>

            {memberInviteLink ? (
              /* Success state — show the link to copy */
              <div className="mt-5">
                <p className="text-sm text-gray-300">Invite created! Share this link with your team member:</p>
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <p className="flex-1 truncate text-xs text-fuchsia-200">{memberInviteLink}</p>
                  <button
                    onClick={() => void navigator.clipboard.writeText(memberInviteLink)}
                    className="shrink-0 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-black text-fuchsia-200 transition hover:bg-fuchsia-500/20"
                  >
                    Copy
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-gray-500">The link expires in 7 days. They must have or create a hiring team account to accept.</p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => { setMemberInviteLink(""); setMemberInviteEmail(""); }}
                    className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.08]"
                  >
                    Invite another
                  </button>
                  <button
                    onClick={() => { setShowMemberInviteModal(false); setMemberInviteLink(""); }}
                    className="flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-2.5 text-sm font-black text-white"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Form state */
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.18em] text-gray-400">Email address</label>
                  <input
                    type="email"
                    value={memberInviteEmail}
                    onChange={(e) => { setMemberInviteEmail(e.target.value); setMemberInviteError(""); }}
                    placeholder="colleague@company.com"
                    disabled={memberInviteLoading}
                    autoFocus
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white placeholder:text-gray-600 focus:border-fuchsia-400/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.18em] text-gray-400">Role</label>
                  <select
                    value={memberInviteRole}
                    onChange={(e) => setMemberInviteRole(e.target.value as "recruiter" | "admin" | "viewer")}
                    disabled={memberInviteLoading}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white focus:border-fuchsia-400/40 focus:outline-none"
                  >
                    <option value="recruiter">Recruiter — can create templates &amp; invite candidates</option>
                    <option value="admin">Admin — full access including billing</option>
                    <option value="viewer">Viewer — read-only access</option>
                  </select>
                </div>

                {memberInviteError && (
                  <p className="text-sm font-semibold text-red-300">{memberInviteError}</p>
                )}

                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => setShowMemberInviteModal(false)}
                    disabled={memberInviteLoading}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.08] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void sendMemberInvite()}
                    disabled={memberInviteLoading || !memberInviteEmail.includes("@")}
                    className="rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-5 py-2.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {memberInviteLoading ? "Sending…" : "Create invite link →"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete-workspace confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm px-4 py-16"
          onClick={() => {
            if (!deleteSubmitting) setShowDeleteModal(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-[1.75rem] border border-red-500/30 bg-[#160a14] p-6 shadow-2xl shadow-red-950/40"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-red-300">
              Confirm deletion
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">
              Delete {company.name}?
            </h3>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              This permanently deletes the workspace, every assessment template,
              every candidate invite and assignment, and every team member.
              This action cannot be undone.
            </p>

            <label className="mt-5 block text-xs font-black uppercase tracking-[0.18em] text-gray-400">
              Type{" "}
              <span className="normal-case text-red-300">{company.name}</span>{" "}
              to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => {
                setDeleteConfirmName(e.target.value);
                if (deleteError) setDeleteError("");
              }}
              autoFocus
              disabled={deleteSubmitting}
              placeholder={company.name}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white placeholder:text-gray-600 focus:border-red-400/40 focus:outline-none"
            />

            {deleteError && (
              <p className="mt-3 text-sm font-semibold text-red-300">{deleteError}</p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteSubmitting}
                className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirmName.trim() !== company.name) {
                    setDeleteError("Name does not match.");
                    return;
                  }
                  try {
                    setDeleteSubmitting(true);
                    setDeleteError("");
                    const res = await fetch("/api/company", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ confirmName: deleteConfirmName.trim() }),
                    });
                    const result = await res.json().catch(() => ({}));
                    if (!res.ok || result.error) {
                      setDeleteError(result.error || "Failed to delete workspace.");
                      return;
                    }
                    // Workspace gone — send the user back to the setup page.
                    router.push("/company/setup");
                  } catch {
                    setDeleteError("Network error. Please try again.");
                  } finally {
                    setDeleteSubmitting(false);
                  }
                }}
                disabled={deleteSubmitting || deleteConfirmName.trim() !== company.name}
                className="rounded-full bg-red-500/90 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteSubmitting ? "Deleting…" : "Permanently delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CorporateAppShell>
  );
}

export default function CompanyDashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
