"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";

const SECTORS = [
  "Financial Services",
  "Management Consulting",
  "Technology",
  "Law",
  "Government / Public Sector",
  "Healthcare",
  "Retail & Consumer",
  "Energy & Infrastructure",
  "Media & Entertainment",
  "Other",
];

const EXPERIENCE_LEVELS = [
  "Graduate / entry level",
  "Junior (1-3 years)",
  "Mid-level (3-5 years)",
  "Senior (5-8 years)",
];

export default function AssessmentCentreSetupPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [sector, setSector] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = role.trim().length > 0 && sector.length > 0 && experienceLevel.length > 0 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/assessment-centre/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: role.trim(), sector, experienceLevel }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(`/assessment-centre/${data.id}/stage-1`);
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CandidateAppShell currentPath="/assessment-centre">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
            Advanced · Mock Assessment Centre
          </div>
          <h1 className="text-3xl font-black leading-[1.04] tracking-[-0.05em] text-white sm:text-4xl lg:text-5xl">
            Set up your{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
              assessment centre
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400">
            Your case study, interview questions and presentation brief will be tailored
            to your role and level. Each session uses a fresh AI-generated scenario.
          </p>
        </div>

        <div className="space-y-8">
          {/* Role input */}
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
            <label className="mb-3 block text-[11px] font-black uppercase tracking-[0.22em] text-purple-300/90">
              Your target role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Strategy Consultant at Deloitte"
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3.5 text-base text-white placeholder-gray-600 outline-none ring-0 transition focus:border-cyan-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-cyan-400/20"
              onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
            />
          </div>

          {/* Sector grid */}
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-purple-300/90">
              Sector
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {SECTORS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSector(s)}
                  className={`rounded-xl border px-3 py-3 text-center text-[12px] font-black leading-tight transition-all ${
                    sector === s
                      ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-900/20 ring-1 ring-cyan-400/30"
                      : "border-white/[0.08] bg-white/[0.03] text-gray-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Experience level */}
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-purple-300/90">
              Experience level
            </p>
            <div className="flex flex-wrap gap-2.5">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setExperienceLevel(level)}
                  className={`rounded-xl border px-5 py-3 text-sm font-black transition-all ${
                    experienceLevel === level
                      ? "border-purple-400/60 bg-purple-400/10 text-purple-300 shadow-lg shadow-purple-900/20 ring-1 ring-purple-400/30"
                      : "border-white/[0.08] bg-white/[0.03] text-gray-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* What to expect */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "📋", label: "Case study", desc: "12-min timed analysis" },
              { icon: "🎤", label: "Interview", desc: "5 competency questions" },
              { icon: "📊", label: "Presentation", desc: "3-min brief + score" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-center"
              >
                <div className="text-2xl">{item.icon}</div>
                <div className="mt-1 text-xs font-black text-white">{item.label}</div>
                <div className="text-[10px] text-gray-500">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex w-full items-center justify-center gap-3 rounded-2xl px-8 py-5 text-base font-black tracking-[-0.02em] text-white shadow-2xl transition-all ${
              canSubmit
                ? "bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 shadow-cyan-900/40 hover:scale-[1.015] hover:shadow-cyan-900/60"
                : "cursor-not-allowed bg-white/[0.06] text-gray-600"
            }`}
          >
            {loading ? (
              <>
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Generating your assessment centre…</span>
              </>
            ) : (
              <>
                <span>Generate my assessment centre</span>
                <span>→</span>
              </>
            )}
          </button>

          {canSubmit && !loading && (
            <p className="text-center text-xs text-gray-600">
              Approximately 45–60 minutes · Each session uses a fresh scenario
            </p>
          )}
        </div>
      </div>
    </CandidateAppShell>
  );
}
