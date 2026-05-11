"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";

const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare & Life Sciences",
  "Professional Services", "Retail & Consumer", "Manufacturing & Engineering",
  "Education", "Media & Entertainment", "Government & Public Sector", "Other",
];

export default function CompanySetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Company name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), industry: industry || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create company."); return; }
      router.push("/company/plan");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CorporateAppShell currentPath="/company/setup">
      <section className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-fuchsia-300">Company Setup</p>
          <h1 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">Create your workspace</h1>
          <p className="mt-4 text-base leading-8 text-gray-300">
            Set up your company account to send assessments, manage candidates, and review results.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 shadow-2xl shadow-black/10 backdrop-blur-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-black text-white">Company name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
                maxLength={100}
                className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-white">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#1a1328] px-4 py-3 text-white outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20"
              >
                <option value="">Select industry (optional)</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 py-3.5 text-sm font-black text-white shadow-xl shadow-purple-950/35 transition hover:scale-[1.02] disabled:opacity-60"
            >
              {saving ? "Creating workspace…" : "Create company workspace →"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          You&apos;ll be the admin. You can invite recruiters and team members from the dashboard.
        </p>
      </section>
    </CorporateAppShell>
  );
}
