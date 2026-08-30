"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
import { useSavedCV } from "@/app/career-docs/hooks/useSavedCV";

type StatementType = "university" | "graduate-scheme" | "mba" | "professional-role" | "masters";
type PSResult = {
  statement: string;
  wordCount: number;
  openingHook: string;
  keyNarrativeThread: string;
  strengths: string[];
  suggestions: string[];
};

const statementTypes: { value: StatementType; label: string; desc: string }[] = [
  { value: "university", label: "University (Undergraduate)", desc: "UCAS / undergraduate admissions" },
  { value: "masters", label: "Postgraduate / Master's", desc: "MSc, MA, MPhil applications" },
  { value: "mba", label: "MBA", desc: "Business school applications" },
  { value: "graduate-scheme", label: "Graduate Scheme", desc: "Grad programmes & rotations" },
  { value: "professional-role", label: "Professional Role", desc: "Senior / specialist job applications" },
];

export default function PersonalStatementPage() {
  const [statementType, setStatementType] = useState<StatementType>("university");
  const [targetProgramOrRole, setTargetProgramOrRole] = useState("");
  const [institution, setInstitution] = useState("");
  const [whyThis, setWhyThis] = useState("");
  const [background, setBackground] = useState("");
  const [achievements, setAchievements] = useState("");
  const [wordLimit, setWordLimit] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upgrade, setUpgrade] = useState(false);
  const [result, setResult] = useState<PSResult | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedCV = useSavedCV();

  // Pre-fill background from saved CV on load
  useEffect(() => {
    if (!savedCV.loading && savedCV.cvText && !background) {
      setBackground(savedCV.cvText);
    }
  }, [savedCV.loading, savedCV.cvText]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep in sync after upload / remove
  useEffect(() => {
    if (!savedCV.loading) {
      setBackground(savedCV.cvText);
    }
  }, [savedCV.cvText, savedCV.loading]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await savedCV.uploadCV(file);
    e.target.value = "";
  }

  function MinHint({ value, min, label }: { value: string; min: number; label: string }) {
    const len = value.trim().length;
    if (len === 0 || len >= min) return null;
    const more = min - len;
    return (
      <p className="mt-1 text-[12px] text-amber-300">
        {label}: at least {min} characters ({more} more needed).
      </p>
    );
  }

  const canSubmit =
    targetProgramOrRole.trim() &&
    whyThis.trim().length >= 20 &&
    background.trim().length >= 20 &&
    background.length <= 15000 &&
    achievements.trim().length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/career-docs/personal-statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementType, targetProgramOrRole, institution, whyThis, background, achievements, wordLimit }),
      });
      const data = await res.json() as { result?: PSResult; error?: string; details?: string[]; upgrade?: boolean };
      if (!res.ok) {
        if (data.upgrade) { setUpgrade(true); return; }
        const detail = data.details?.join(", ");
        setError(detail ? `${data.error ?? "Invalid request."} (${detail})` : (data.error ?? "Something went wrong."));
        return;
      }
      setResult(data.result!);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyStatement() {
    if (!result) return;
    navigator.clipboard.writeText(result.statement).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  if (upgrade) {
    return (
      <CandidateAppShell currentPath="/career-docs">
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mb-6 flex justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden
              className="h-10 w-10 text-purple-300">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Professional plan required</h1>
          <p className="mt-3 text-sm leading-7 text-gray-400">Personal Statement Generator is available on the Professional plan.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/pricing"
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3.5 text-center text-sm font-bold text-on-accent shadow-lg"
            >
              See plans →
            </Link>
            <Link
              href="/career-docs"
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3.5 text-center text-sm font-bold text-white"
            >
              Back to the CV Studio
            </Link>
          </div>
        </div>
      </CandidateAppShell>
    );
  }

  return (
    <CandidateAppShell currentPath="/career-docs">
      <div className="mx-auto max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/career-docs" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-300 transition">← CV Studio</Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <p className="text-[12px] font-bold tracking-wide text-emerald-300">AI Writer</p>
              <h1 className="text-2xl font-bold tracking-tight text-white">Personal Statement Generator</h1>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[480px_1fr]">
          {/* Input */}
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl space-y-5">

              {/* Type selector */}
              <div>
                <label className="mb-2 block text-xs font-bold tracking-wide text-gray-400">Statement type</label>
                <div className="space-y-2">
                  {statementTypes.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setStatementType(opt.value)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                        statementType === opt.value
                          ? "border-emerald-400/40 bg-emerald-400/10 text-white"
                          : "border-white/[0.08] bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-gray-300"
                      }`}>
                      <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${statementType === opt.value ? "bg-emerald-400" : "bg-gray-600"}`} />
                      <div>
                        <p className="text-sm font-bold">{opt.label}</p>
                        <p className="text-[12px] text-gray-400">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-400">Programme or role *</label>
                <input type="text" value={targetProgramOrRole} onChange={(e) => setTargetProgramOrRole(e.target.value)}
                  placeholder="e.g. Computer Science, McKinsey Business Analyst"
                  className="w-full rounded-xl border border-white/[0.08] bg-recess-30 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none focus:border-emerald-400/40 focus:ring-1 focus:ring-emerald-400/20" required />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-400">Institution / employer</label>
                <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. University of Edinburgh, Deloitte"
                  className="w-full rounded-xl border border-white/[0.08] bg-recess-30 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none focus:border-emerald-400/40 focus:ring-1 focus:ring-emerald-400/20" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-400">Why this programme / role? *</label>
                <textarea value={whyThis} onChange={(e) => setWhyThis(e.target.value)}
                  placeholder="What drew you to this specifically? Any pivotal moments, projects, experiences, or people that shaped your direction…"
                  rows={4}
                  className="w-full rounded-xl border border-white/[0.08] bg-recess-30 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none focus:border-emerald-400/40 focus:ring-1 focus:ring-emerald-400/20 resize-y" required />
                <MinHint value={whyThis} min={20} label="A sentence or two works best" />
              </div>

              {/* Background field with CV integration */}
              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-400">Your background *</label>

                {/* Saved CV banner */}
                {!savedCV.loading && (
                  <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-emerald-400">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="flex-1 truncate text-[12px] font-semibold text-emerald-300">
                      {savedCV.hasSavedCV
                        ? savedCV.cvFileName
                          ? `CV: ${savedCV.cvFileName}`
                          : "Pre-filled from saved profile CV"
                        : "No saved CV. Upload one to use across Career Docs"}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={savedCV.uploading}
                        className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[12px] font-bold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-50"
                      >
                        {savedCV.uploading ? "Uploading…" : savedCV.hasSavedCV ? "Replace" : "Upload CV"}
                      </button>
                      {savedCV.hasSavedCV && (
                        <button
                          type="button"
                          onClick={() => void savedCV.removeCV()}
                          disabled={savedCV.removing}
                          className="rounded-lg border border-red-400/30 bg-red-400/[0.08] px-2.5 py-1 text-[12px] font-bold text-red-400 transition hover:bg-red-400/20 disabled:opacity-50"
                        >
                          {savedCV.removing ? "Removing…" : "Remove"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => void handleFileChange(e)}
                />

                {savedCV.error && (
                  <p className="mb-2 text-xs text-red-400">{savedCV.error}</p>
                )}

                <textarea value={background} onChange={(e) => setBackground(e.target.value)}
                  placeholder="Academic qualifications, relevant work experience, courses, extracurriculars, skills…"
                  rows={4}
                  className="w-full rounded-xl border border-white/[0.08] bg-recess-30 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none focus:border-emerald-400/40 focus:ring-1 focus:ring-emerald-400/20 resize-y" required />
                <p className={`mt-1 text-right text-[12px] ${background.length > 15000 ? "text-red-400" : "text-gray-400"}`}>
                  {background.length.toLocaleString()} / 15,000 characters
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-400">Key achievements *</label>
                <textarea value={achievements} onChange={(e) => setAchievements(e.target.value)}
                  placeholder="Awards, projects, leadership roles, results you're proud of. Include numbers where possible…"
                  rows={3}
                  className="w-full rounded-xl border border-white/[0.08] bg-recess-30 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none focus:border-emerald-400/40 focus:ring-1 focus:ring-emerald-400/20 resize-y" required />
                <MinHint value={achievements} min={10} label="A line per achievement is plenty" />
              </div>

              <div>
                <label className="mb-2 flex items-center justify-between text-xs font-bold tracking-wide text-gray-400">
                  Word limit <span className="text-white">{wordLimit} words</span>
                </label>
                <input type="range" min={300} max={1000} step={50} value={wordLimit}
                  onChange={(e) => setWordLimit(Number(e.target.value))}
                  className="w-full accent-emerald-400" />
                <div className="mt-1 flex justify-between text-[12px] text-gray-400">
                  <span>300 (concise)</span><span>1000 (detailed)</span>
                </div>
              </div>
            </div>

            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

            <button type="submit" disabled={loading || !canSubmit}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold transition-all ${
                !loading && canSubmit
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-on-accent shadow-lg hover:scale-[1.01]"
                  : "cursor-not-allowed bg-white/[0.05] text-gray-400"
              }`}>
              {loading ? (
                <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Writing your statement…</>
              ) : "Generate personal statement →"}
            </button>
            {!loading && !canSubmit && (
              <p className="text-center text-[12px] leading-5 text-gray-400">
                To enable the button:{" "}
                {[
                  !targetProgramOrRole.trim() && "add the programme or role",
                  whyThis.trim().length < 20 && "say a little more in “Why this programme” (20+ characters)",
                  (background.trim().length < 20 || background.length > 15000) && "add your background (20 to 15,000 characters)",
                  achievements.trim().length < 10 && "add a key achievement (10+ characters)",
                ].filter(Boolean).join(" · ")}
              </p>
            )}
          </form>

          {/* Output */}
          <div className="space-y-4">
            {!result && !loading && (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-dashed border-white/[0.08] text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">Your personal statement will appear here</p>
              </div>
            )}

            {loading && (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04]">
                <svg className="h-8 w-8 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-400">Crafting your personal statement…</p>
              </div>
            )}

            {result && (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{result.wordCount} words</span>
                  <button onClick={copyStatement}
                    className="ml-auto rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[0.1]">
                    {copied ? "✓ Copied!" : "Copy statement"}
                  </button>
                </div>

                {/* Statement */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
                  <p className="mb-3 text-[12px] font-bold tracking-wide text-emerald-300">Your personal statement</p>
                  <div className="whitespace-pre-line text-sm leading-8 text-gray-200">{result.statement}</div>
                </div>

                {/* Narrative notes */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl">
                    <p className="mb-2 text-[12px] font-bold tracking-wide text-purple-300">Opening approach</p>
                    <p className="text-sm leading-6 text-gray-300">{result.openingHook}</p>
                  </div>
                  <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl">
                    <p className="mb-2 text-[12px] font-bold tracking-wide text-cyan-300">Central narrative</p>
                    <p className="text-sm leading-6 text-gray-300">{result.keyNarrativeThread}</p>
                  </div>
                </div>

                {/* Strengths + suggestions */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-emerald-400/[0.18] bg-emerald-400/[0.05] p-5">
                    <p className="mb-3 text-[12px] font-bold tracking-wide text-emerald-400">What works well</p>
                    <ul className="space-y-2">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="mt-0.5 text-emerald-400">✓</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[1.75rem] border border-amber-400/[0.18] bg-amber-400/[0.05] p-5">
                    <p className="mb-3 text-[12px] font-bold tracking-wide text-amber-400">Before you submit</p>
                    <ul className="space-y-2">
                      {result.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="mt-0.5 text-amber-400">→</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </CandidateAppShell>
  );
}
