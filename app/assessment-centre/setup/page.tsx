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

const STAGES = [
  {
    id: "stage1",
    icon: "📋",
    label: "Case study",
    desc: "12-min timed analysis",
    detail: "Read a business scenario and write a structured response under a timer.",
    color: "purple",
  },
  {
    id: "stage2",
    icon: "🎤",
    label: "Competency interview",
    desc: "5 questions · voice + camera",
    detail: "Five tailored competency questions scored on substance, delivery and presence.",
    color: "fuchsia",
  },
  {
    id: "stage3",
    icon: "📊",
    label: "Presentation",
    desc: "3-min brief + score",
    detail: "Receive a brief, prepare for 3 minutes, then deliver a scored spoken presentation.",
    color: "cyan",
  },
] as const;

type StageId = "stage1" | "stage2" | "stage3";

export default function AssessmentCentreSetupPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [sector, setSector] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [selectedStages, setSelectedStages] = useState<Set<StageId>>(
    new Set(["stage1", "stage2", "stage3"])
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleStage(id: StageId) {
    setSelectedStages((prev) => {
      const next = new Set(prev);
      if (next.has(id) && next.size === 1) return prev; // must keep at least 1
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // First selected stage in order
  const firstStage: StageId = selectedStages.has("stage1")
    ? "stage1"
    : selectedStages.has("stage2")
      ? "stage2"
      : "stage3";

  const totalMinutes =
    (selectedStages.has("stage1") ? 12 : 0) +
    (selectedStages.has("stage2") ? 20 : 0) +
    (selectedStages.has("stage3") ? 8 : 0);

  const canSubmit = role.trim().length > 0 && sector.length > 0 && experienceLevel.length > 0 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/assessment-centre/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role.trim(),
          sector,
          experienceLevel,
          selectedStages: Array.from(selectedStages),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // StageId uses "stage1" format; URL segments use "stage-1" format
      const stageUrl = firstStage.replace(/stage(\d)/, "stage-$1");
      router.push(`/assessment-centre/${data.id}/${stageUrl}`);
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

          {/* Stage selector */}
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-purple-300/90">
                Stages to include
              </p>
              <span className="text-[11px] text-gray-500">
                Click to deselect · at least 1 required
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {STAGES.map((stage) => {
                const selected = selectedStages.has(stage.id);
                const isLast = selectedStages.size === 1 && selected;
                const borderColour = selected
                  ? stage.color === "purple"
                    ? "border-purple-400/60 ring-1 ring-purple-400/30"
                    : stage.color === "fuchsia"
                      ? "border-fuchsia-400/60 ring-1 ring-fuchsia-400/30"
                      : "border-cyan-400/60 ring-1 ring-cyan-400/30"
                  : "border-white/[0.08]";
                const bgColour = selected
                  ? stage.color === "purple"
                    ? "bg-purple-400/[0.07]"
                    : stage.color === "fuchsia"
                      ? "bg-fuchsia-400/[0.07]"
                      : "bg-cyan-400/[0.07]"
                  : "bg-white/[0.025] opacity-50";
                const labelColour = selected
                  ? stage.color === "purple"
                    ? "text-purple-300"
                    : stage.color === "fuchsia"
                      ? "text-fuchsia-300"
                      : "text-cyan-300"
                  : "text-gray-600";

                return (
                  <button
                    key={stage.id}
                    onClick={() => toggleStage(stage.id)}
                    disabled={isLast}
                    title={isLast ? "At least one stage must be selected" : selected ? "Click to remove this stage" : "Click to add this stage"}
                    className={`relative rounded-xl border p-4 text-left transition-all ${borderColour} ${bgColour} ${isLast ? "cursor-not-allowed" : "cursor-pointer hover:opacity-100"}`}
                  >
                    {/* Selected/deselected indicator */}
                    <div className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-black transition-all ${
                      selected
                        ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                        : "border-white/20 bg-white/[0.04] text-gray-600"
                    }`}>
                      {selected ? "✓" : "✕"}
                    </div>
                    <div className="mb-2 text-2xl">{stage.icon}</div>
                    <div className={`text-sm font-black ${selected ? "text-white" : "text-gray-500"}`}>
                      {stage.label}
                    </div>
                    <div className={`mt-0.5 text-[11px] font-semibold ${labelColour}`}>
                      {stage.desc}
                    </div>
                    <p className={`mt-2 text-[11px] leading-5 ${selected ? "text-gray-400" : "text-gray-600"}`}>
                      {stage.detail}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Time estimate */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
              <span className="text-xs text-gray-500">
                {selectedStages.size} stage{selectedStages.size !== 1 ? "s" : ""} selected
              </span>
              <span className="text-xs font-black text-white">
                ~{totalMinutes} minutes total
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

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

          {loading && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-cyan-300/20 bg-cyan-400/[0.07] px-4 py-3 text-left text-xs leading-5 text-cyan-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="mt-0.5 h-4 w-4 shrink-0 animate-pulse text-cyan-300" aria-hidden><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span>
                <span className="font-black">This takes a minute or two.</span>{" "}
                We are writing a complete, fresh scenario for your sector: the
                case study document, exhibits and stage tasks. Keep this page
                open; you will move straight into Stage 1 when it is ready.
              </span>
            </div>
          )}
          {canSubmit && !loading && (
            <p className="text-center text-xs text-gray-600">
              Each session uses a fresh AI-generated scenario
            </p>
          )}
        </div>
      </div>
    </CandidateAppShell>
  );
}
