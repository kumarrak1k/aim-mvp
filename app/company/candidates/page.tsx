"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";
import { getPlan, isPlanActive, CORPORATE_TRIAL_INVITE_CAP } from "@/app/lib/corporatePlan";
import { Suspense } from "react";

type Template = { id: string; name: string; role: string };
type Assignment = {
  id: string;
  candidateEmail: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  inviteToken: string;
  template: { id: string; name: string; role: string };
  emailSent?: boolean;
  emailSentAt?: string | null;
  emailError?: string | null;
  emailSendCount?: number;
};
type Company = {
  planId?: string | null;
  planStatus: string;
  trialEndsAt: string | null;
  trialInvitesUsed?: number;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-400/15 text-yellow-200 border-yellow-400/25",
  started: "bg-blue-400/15 text-blue-200 border-blue-400/25",
  completed: "bg-green-400/15 text-green-200 border-green-400/25",
};

function CandidatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTemplate = searchParams.get("templateId") || "";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [templateId, setTemplateId] = useState(preselectedTemplate);
  const [expiryDays, setExpiryDays] = useState(7);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [newInviteLink, setNewInviteLink] = useState<string | null>(null);
  const [newInviteEmailStatus, setNewInviteEmailStatus] = useState<
    | { state: "sent"; recipient: string }
    | { state: "failed"; recipient: string; reason: string }
    | null
  >(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendFeedback, setResendFeedback] = useState<{
    id: string;
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [companyRes, assignmentsRes, templatesRes] = await Promise.all([
          fetch("/api/company"),
          fetch("/api/company/assignments"),
          fetch("/api/company/templates"),
        ]);
        const companyData = await companyRes.json();
        if (!companyData.company) { router.push("/company/setup"); return; }
        setMemberRole(companyData.member?.role || null);
        setCompany(companyData.company || null);
        const aData = await assignmentsRes.json();
        setAssignments(aData.assignments || []);
        const tData = await templatesRes.json();
        const active = (tData.templates || []).filter((t: Template & { isActive: boolean }) => t.isActive);
        setTemplates(active);
        if (!preselectedTemplate && active.length > 0) setTemplateId(active[0].id);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, preselectedTemplate]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) { setSendError("Valid email is required."); return; }
    if (!templateId) { setSendError("Select a template first."); return; }
    setSending(true);
    setSendError("");
    setNewInviteLink(null);
    setNewInviteEmailStatus(null);
    try {
      const res = await fetch("/api/company/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateEmail: email.trim(), templateId, expiryDays }),
      });
      const data = await res.json();
      if (!res.ok) { setSendError(data.error || "Failed to create invite."); return; }
      const recipient: string = data.assignment.candidateEmail;
      const link = `${window.location.origin}/assessment/${data.assignment.inviteToken}`;
      setNewInviteLink(link);
      setNewInviteEmailStatus(
        data.emailSent
          ? { state: "sent", recipient }
          : { state: "failed", recipient, reason: data.emailWarning || "Email send failed." }
      );
      setAssignments((prev) => [data.assignment, ...prev]);
      setEmail("");
    } finally {
      setSending(false);
    }
  }

  async function resendInvite(id: string) {
    setResendingId(id);
    setResendFeedback(null);
    try {
      const res = await fetch(`/api/company/assignments/${id}/resend-invite`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.emailSent) {
        setResendFeedback({ id, ok: true, message: "Invite email resent." });
        if (data.assignment) {
          setAssignments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, ...data.assignment } : a))
          );
        }
      } else {
        setResendFeedback({
          id,
          ok: false,
          message: data.error || "Resend failed.",
        });
        if (data.assignment) {
          setAssignments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, ...data.assignment } : a))
          );
        }
      }
    } catch {
      setResendFeedback({ id, ok: false, message: "Network error during resend." });
    } finally {
      setResendingId(null);
      // Auto-clear the feedback after a few seconds.
      setTimeout(() => {
        setResendFeedback((current) => (current && current.id === id ? null : current));
      }, 4000);
    }
  }

  async function copyLink(token: string) {
    const link = `${window.location.origin}/assessment/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  async function deleteAssignment(id: string, candidateEmail: string) {
    if (!window.confirm(`Delete the assessment invite for ${candidateEmail}? This can't be undone.`)) return;
    const res = await fetch(`/api/company/assignments/${id}`, { method: "DELETE" });
    if (res.ok) setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) {
    return (
      <CorporateAppShell currentPath="/company/candidates">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
        </div>
      </CorporateAppShell>
    );
  }

  const canInvite = memberRole === "admin" || memberRole === "recruiter";
  const plan = getPlan(company?.planId);
  const planActive = company ? isPlanActive(company) : false;
  const onTrial = company?.planStatus === "trial";
  const monthNow = new Date();
  const invitesThisMonth = assignments.filter((a) => {
    const d = new Date(a.createdAt);
    return d.getMonth() === monthNow.getMonth() && d.getFullYear() === monthNow.getFullYear();
  }).length;
  const invitesLeft = onTrial
    ? Math.max(0, CORPORATE_TRIAL_INVITE_CAP - (company?.trialInvitesUsed ?? 0))
    : plan
      ? Math.max(0, plan.invitesPerMonth - invitesThisMonth)
      : 0;
  const atInviteCap = planActive && invitesLeft <= 0;

  return (
    <CorporateAppShell currentPath="/company/candidates">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-fuchsia-300">Candidates</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] sm:text-4xl">Invite candidates</h1>
          <p className="mt-2 text-gray-400">Send personalised assessment links for candidates to complete at their own pace.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[400px,1fr]">
          {/* Invite form */}
          {canInvite && (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 shadow-xl shadow-black/10">
              <h2 className="mb-5 text-lg font-black">Send invite</h2>
              {!planActive ? (
                <p className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                  Your workspace needs an active plan to send invites.{" "}
                  <a href="/company/dashboard" className="font-black underline">Choose a plan →</a>
                </p>
              ) : (
                <p className={`mb-5 text-sm font-semibold ${invitesLeft <= 2 ? "text-amber-300" : "text-gray-400"}`}>
                  {invitesLeft} invite{invitesLeft === 1 ? "" : "s"} remaining {onTrial ? "in your trial" : "this month"}.
                  {atInviteCap && (
                    <>{" "}<a href="/company/dashboard" className="font-black text-fuchsia-300 underline">Upgrade to send more →</a></>
                  )}
                </p>
              )}
              <form onSubmit={handleInvite} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-black text-white">Candidate email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-white">Assessment template *</label>
                  {templates.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      No active templates. <a href="/company/templates/new" className="text-fuchsia-300 hover:underline">Create one →</a>
                    </p>
                  ) : (
                    <select
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#1a1328] px-4 py-3 text-white outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20"
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} — {t.role}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-white">Link expires after: {expiryDays} days</label>
                  <input type="range" min={1} max={30} value={expiryDays} onChange={(e) => setExpiryDays(Number(e.target.value))} className="w-full accent-fuchsia-400" />
                </div>

                {sendError && (
                  <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{sendError}</p>
                )}

                {newInviteLink && (
                  <div
                    className={`rounded-xl border p-4 ${
                      newInviteEmailStatus?.state === "failed"
                        ? "border-amber-400/30 bg-amber-400/10"
                        : "border-green-400/30 bg-green-400/10"
                    }`}
                  >
                    <p
                      className={`mb-2 text-sm font-black ${
                        newInviteEmailStatus?.state === "failed"
                          ? "text-amber-300"
                          : "text-green-300"
                      }`}
                    >
                      {newInviteEmailStatus?.state === "sent"
                        ? `Invite emailed to ${newInviteEmailStatus.recipient}.`
                        : newInviteEmailStatus?.state === "failed"
                          ? "Invite created — but email send failed."
                          : "Invite created!"}
                    </p>
                    {newInviteEmailStatus?.state === "failed" && (
                      <p className="mb-3 text-xs text-amber-200/90">
                        {newInviteEmailStatus.reason} You can copy the link
                        below and send it manually, or use Resend invite from
                        the table once email is back online.
                      </p>
                    )}
                    <p className="mb-3 break-all text-xs text-gray-300">{newInviteLink}</p>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(newInviteLink)}
                      className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Copy link
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending || templates.length === 0 || !planActive || atInviteCap}
                  className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 py-3.5 text-sm font-black text-white shadow-xl shadow-purple-950/35 transition hover:scale-[1.02] disabled:opacity-60"
                >
                  {sending ? "Creating invite…" : atInviteCap ? "Invite limit reached" : "Create invite link →"}
                </button>
              </form>
            </div>
          )}

          {/* Assignments table */}
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/10">
            <h2 className="mb-5 text-lg font-black">All assessments ({assignments.length})</h2>

            {assignments.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-400">No assessments sent yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-3 text-left font-black text-gray-400">Candidate</th>
                      <th className="pb-3 text-left font-black text-gray-400">Template</th>
                      <th className="pb-3 text-left font-black text-gray-400">Status</th>
                      <th className="pb-3 text-left font-black text-gray-400">Email</th>
                      <th className="pb-3 text-left font-black text-gray-400">Expires</th>
                      <th className="pb-3 text-left font-black text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {assignments.map((a) => {
                      const expired = new Date(a.expiresAt) < new Date();
                      const emailMaxedOut = (a.emailSendCount ?? 0) >= 5;
                      const isResending = resendingId === a.id;
                      const showResendFeedback = resendFeedback?.id === a.id;
                      return (
                        <tr key={a.id}>
                          <td className="py-3 font-semibold text-white">{a.candidateEmail}</td>
                          <td className="py-3 text-gray-300">{a.template.name}</td>
                          <td className="py-3">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-black capitalize ${STATUS_COLORS[a.status] || "bg-white/5 text-gray-300 border-white/10"}`}>
                              {expired && a.status === "pending" ? "expired" : a.status}
                            </span>
                          </td>
                          <td className="py-3">
                            {a.emailSent ? (
                              <span
                                className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-xs font-black text-emerald-200"
                                title={a.emailSentAt ? `Sent ${new Date(a.emailSentAt).toLocaleString("en-GB")}` : "Sent"}
                              >
                                Sent
                              </span>
                            ) : a.emailError ? (
                              <span
                                className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-xs font-black text-amber-200"
                                title={a.emailError}
                              >
                                Failed
                              </span>
                            ) : (
                              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-black text-gray-400">
                                Not sent
                              </span>
                            )}
                          </td>
                          <td className={`py-3 text-xs ${expired ? "text-red-400" : "text-gray-400"}`}>
                            {new Date(a.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex flex-wrap gap-2">
                                {a.status !== "completed" && (
                                  <button
                                    onClick={() => copyLink(a.inviteToken)}
                                    className="rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1.5 text-xs font-black text-white transition hover:bg-white/[0.09]"
                                  >
                                    {copiedToken === a.inviteToken ? "Copied!" : "Copy link"}
                                  </button>
                                )}
                                {canInvite && a.status !== "completed" && !expired && (
                                  <button
                                    onClick={() => resendInvite(a.id)}
                                    disabled={isResending || emailMaxedOut}
                                    title={emailMaxedOut ? "Resend limit reached (5)." : "Email this invite again."}
                                    className="rounded-lg border border-fuchsia-400/30 bg-fuchsia-400/10 px-2.5 py-1.5 text-xs font-black text-fuchsia-200 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isResending ? "Sending…" : "Resend"}
                                  </button>
                                )}
                                {canInvite && a.status !== "completed" && (
                                  <button
                                    onClick={() => deleteAssignment(a.id, a.candidateEmail)}
                                    className="rounded-lg border border-red-400/20 bg-red-400/10 px-2.5 py-1.5 text-xs font-black text-red-300 transition hover:bg-red-400/15"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                              {showResendFeedback && (
                                <p
                                  className={`text-[11px] font-semibold ${
                                    resendFeedback?.ok ? "text-emerald-300" : "text-amber-300"
                                  }`}
                                >
                                  {resendFeedback?.message}
                                </p>
                              )}
                            </div>
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
      </div>
    </CorporateAppShell>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={
      <CorporateAppShell currentPath="/company/candidates">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
        </div>
      </CorporateAppShell>
    }>
      <CandidatesContent />
    </Suspense>
  );
}
