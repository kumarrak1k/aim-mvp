"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MarketingShell } from "@/app/components/marketing/MarketingShell";
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
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [templateId, setTemplateId] = useState(preselectedTemplate);
  const [expiryDays, setExpiryDays] = useState(7);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [newInviteLink, setNewInviteLink] = useState<string | null>(null);

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
    try {
      const res = await fetch("/api/company/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateEmail: email.trim(), templateId, expiryDays }),
      });
      const data = await res.json();
      if (!res.ok) { setSendError(data.error || "Failed to create invite."); return; }
      const link = `${window.location.origin}/assessment/${data.assignment.inviteToken}`;
      setNewInviteLink(link);
      setAssignments((prev) => [data.assignment, ...prev]);
      setEmail("");
    } finally {
      setSending(false);
    }
  }

  async function copyLink(token: string) {
    const link = `${window.location.origin}/assessment/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  async function deleteAssignment(id: string) {
    const res = await fetch(`/api/company/assignments/${id}`, { method: "DELETE" });
    if (res.ok) setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) {
    return (
      <MarketingShell currentPath="/company/candidates">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
        </div>
      </MarketingShell>
    );
  }

  const canInvite = memberRole === "admin" || memberRole === "recruiter";

  return (
    <MarketingShell currentPath="/company/candidates">
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
                  <div className="rounded-xl border border-green-400/30 bg-green-400/10 p-4">
                    <p className="mb-2 text-sm font-black text-green-300">Invite created!</p>
                    <p className="mb-3 break-all text-xs text-green-200">{newInviteLink}</p>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(newInviteLink)}
                      className="rounded-full bg-green-400/20 px-4 py-2 text-xs font-black text-green-200 transition hover:bg-green-400/30"
                    >
                      Copy link
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending || templates.length === 0}
                  className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 py-3.5 text-sm font-black text-white shadow-xl shadow-purple-950/35 transition hover:scale-[1.02] disabled:opacity-60"
                >
                  {sending ? "Creating invite…" : "Create invite link →"}
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
                      <th className="pb-3 text-left font-black text-gray-400">Expires</th>
                      <th className="pb-3 text-left font-black text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {assignments.map((a) => {
                      const expired = new Date(a.expiresAt) < new Date();
                      return (
                        <tr key={a.id}>
                          <td className="py-3 font-semibold text-white">{a.candidateEmail}</td>
                          <td className="py-3 text-gray-300">{a.template.name}</td>
                          <td className="py-3">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-black capitalize ${STATUS_COLORS[a.status] || "bg-white/5 text-gray-300 border-white/10"}`}>
                              {expired && a.status === "pending" ? "expired" : a.status}
                            </span>
                          </td>
                          <td className={`py-3 text-xs ${expired ? "text-red-400" : "text-gray-400"}`}>
                            {new Date(a.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              {a.status !== "completed" && (
                                <button
                                  onClick={() => copyLink(a.inviteToken)}
                                  className="rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1.5 text-xs font-black text-white transition hover:bg-white/[0.09]"
                                >
                                  {copiedToken === a.inviteToken ? "Copied!" : "Copy link"}
                                </button>
                              )}
                              {canInvite && a.status !== "completed" && (
                                <button
                                  onClick={() => deleteAssignment(a.id)}
                                  className="rounded-lg border border-red-400/20 bg-red-400/10 px-2.5 py-1.5 text-xs font-black text-red-300 transition hover:bg-red-400/15"
                                >
                                  Delete
                                </button>
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
    </MarketingShell>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={
      <MarketingShell currentPath="/company/candidates">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
        </div>
      </MarketingShell>
    }>
      <CandidatesContent />
    </Suspense>
  );
}
