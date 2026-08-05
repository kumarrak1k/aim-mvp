"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";

type Template = {
  id: string;
  name: string;
  role: string;
  description: string | null;
  templateType: string;
  acStages: string[];
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  isActive: boolean;
  createdAt: string;
  _count: { assignments: number };
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Standard: "bg-blue-400/15 text-blue-200 border-blue-400/25",
  Challenging: "bg-yellow-400/15 text-yellow-200 border-yellow-400/25",
  Executive: "bg-fuchsia-400/15 text-fuchsia-200 border-fuchsia-400/25",
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [companyRes, templatesRes] = await Promise.all([
          fetch("/api/company"),
          fetch("/api/company/templates"),
        ]);
        const companyData = await companyRes.json();
        if (!companyData.company) { router.push("/company/setup"); return; }
        setMemberRole(companyData.member?.role || null);
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

  async function toggleActive(template: Template) {
    const res = await fetch(`/api/company/templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !template.isActive }),
    });
    if (res.ok) {
      setTemplates((prev) => prev.map((t) => t.id === template.id ? { ...t, isActive: !t.isActive } : t));
    }
  }

  if (loading) {
    return (
      <CorporateAppShell currentPath="/company/templates">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
        </div>
      </CorporateAppShell>
    );
  }

  const canEdit = memberRole === "admin" || memberRole === "recruiter";

  return (
    <CorporateAppShell currentPath="/company/templates">
      <div className="mx-auto max-w-7xl 2xl:max-w-[96rem] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wide text-fuchsia-300">Assessment Templates</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Templates</h1>
            <p className="mt-2 text-gray-400">Reusable interview configurations for different roles.</p>
          </div>
          {canEdit && (
            <Link
              href="/company/templates/new"
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
            >
              + New template
            </Link>
          )}
        </div>

        {templates.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-16 text-center">
            <p className="text-lg font-bold text-gray-300">No templates yet</p>
            <p className="mt-2 text-gray-400">Create your first template to start sending assessments.</p>
            {canEdit && (
              <Link
                href="/company/templates/new"
                className="mt-6 inline-block rounded-full bg-fuchsia-500/20 px-6 py-3 text-sm font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/30"
              >
                Create template →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((t) => (
              <div key={t.id} className={`rounded-[2rem] border bg-white/[0.04] p-6 shadow-xl shadow-black/10 transition ${t.isActive ? "border-white/10" : "border-white/5 opacity-60"}`}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      {t.templateType === "assessment-centre" ? (
                        <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-purple-200">
                          Assessment centre
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-gray-400">
                          Interview
                        </span>
                      )}
                    </div>
                    <p className="truncate text-lg font-bold text-white">{t.name}</p>
                    <p className="mt-0.5 text-sm text-gray-400">{t.role}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${DIFFICULTY_COLORS[t.difficulty] || "bg-white/5 text-gray-300 border-white/10"}`}>
                    {t.difficulty}
                  </span>
                </div>

                {t.description && (
                  <p className="mb-4 text-sm leading-6 text-gray-400 line-clamp-2">{t.description}</p>
                )}

                <div className="mb-5 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-gray-300">{t.experienceLevel}</span>
                  {t.templateType === "assessment-centre" ? (
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-gray-300">
                      {t.acStages.length} stage{t.acStages.length !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-gray-300">{t.interviewType}</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{t._count.assignments} sent</span>
                  <span>{new Date(t.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>

                {canEdit && (
                  <div className="mt-5 flex gap-2">
                    <Link
                      href={`/company/templates/${t.id}`}
                      className="flex-1 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-white/[0.09]"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => toggleActive(t)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition ${t.isActive ? "border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/15" : "border-green-400/20 bg-green-400/10 text-green-300 hover:bg-green-400/15"}`}
                    >
                      {t.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <Link
                      href={`/company/candidates?templateId=${t.id}`}
                      className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-3 py-2 text-xs font-bold text-fuchsia-200 transition hover:bg-fuchsia-400/15"
                    >
                      Invite
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </CorporateAppShell>
  );
}
