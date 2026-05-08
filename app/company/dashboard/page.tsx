"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MarketingShell } from "@/app/components/marketing/MarketingShell";

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

type CompanyData = {
  company: {
    id: string;
    name: string;
    industry: string | null;
    brandColor: string;
    _count: { members: number; templates: number; assignments: number };
  };
  member: { id: string; role: string };
} | null;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-400/15 text-yellow-200 border-yellow-400/25",
  started: "bg-blue-400/15 text-blue-200 border-blue-400/25",
  completed: "bg-green-400/15 text-green-200 border-green-400/25",
};

export default function CompanyDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<CompanyData>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

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
        setData(companyData);
        const aData = await assignmentsRes.json();
        setAssignments(aData.assignments || []);
        const tData = await templatesRes.json();
        setTemplates(tData.templates || []);
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
      <MarketingShell currentPath="/company/dashboard">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
        </div>
      </MarketingShell>
    );
  }

  if (!data) return null;

  const { company, member } = data;
  const recentAssignments = assignments.slice(0, 8);
  const activeTemplates = templates.filter((t) => t.isActive).length;
  const completedCount = assignments.filter((a) => a.status === "completed").length;
  const pendingCount = assignments.filter((a) => a.status === "pending").length;

  return (
    <MarketingShell currentPath="/company/dashboard">
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

        {/* Stats */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Team members", value: company._count.members, color: "text-fuchsia-300" },
            { label: "Active templates", value: activeTemplates, color: "text-purple-300" },
            { label: "Total invites sent", value: company._count.assignments, color: "text-cyan-300" },
            { label: "Completed assessments", value: completedCount, color: "text-green-300" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
              <p className="text-sm font-semibold text-gray-400">{label}</p>
              <p className={`mt-2 text-4xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            { href: "/company/templates", label: "Assessment templates", desc: `${activeTemplates} active`, icon: "📋" },
            { href: "/company/candidates", label: "Candidates", desc: `${pendingCount} awaiting`, icon: "👥" },
            { href: "/company/dashboard", label: "Team & settings", desc: `${company._count.members} members`, icon: "⚙️" },
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

        {/* Recent assignments */}
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-black">Recent assessments</h2>
            <Link href="/company/candidates" className="text-sm font-black text-fuchsia-300 hover:text-fuchsia-200">
              View all →
            </Link>
          </div>

          {recentAssignments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-400">No assessments yet.</p>
              <Link href="/company/candidates">
                <button className="mt-4 rounded-full bg-fuchsia-500/20 px-5 py-2.5 text-sm font-black text-fuchsia-200 transition hover:bg-fuchsia-500/30">
                  Send your first invite →
                </button>
              </Link>
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
    </MarketingShell>
  );
}
