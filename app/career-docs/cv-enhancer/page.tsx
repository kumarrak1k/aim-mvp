"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
import { useSavedCV } from "@/app/career-docs/hooks/useSavedCV";

type EnhancedBullet = { original: string; enhanced: string };
type Section = { name: string; score: number; feedback: string; suggestion: string };
type CVResult = {
  overallScore: number;
  overallLabel: string;
  summary: string;
  sections: Section[];
  quickWins: string[];
  enhancedBullets: EnhancedBullet[];
  missingKeywords: string[];
  atsTips: string[];
  topStrength: string;
  biggestGap: string;
};

type Change = { id: string; section: string; original: string; replacement: string; reason: string };
type Flagged = { section: string; note: string };
type EnhancedResult = { fullEnhancedCV: string; changes: Change[]; flagged: Flagged[] };
type Gap = { id: string; section: string; question: string; hint: string };

function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(10, Math.max(0, score)) / 10);
  const col = score >= 7 ? "#34d399" : score >= 5 ? "#fbbf24" : "#f87171";
  return (
    <div className="relative mx-auto inline-flex">
      <svg width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        <circle cx="56" cy="56" r={r} fill="none" stroke={col} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 56 56)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color: col }}>{score}</span>
        <span className="text-[10px] font-bold text-gray-500">/10</span>
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const col = score >= 7 ? "bg-emerald-400" : score >= 5 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10">
        <div className={`h-full rounded-full ${col}`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className="w-6 text-right text-xs font-bold text-white">{score}</span>
    </div>
  );
}

export default function CVEnhancerPage() {
  const [targetRole, setTargetRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showJd, setShowJd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upgrade, setUpgrade] = useState(false);
  const [result, setResult] = useState<CVResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [enhancedResult, setEnhancedResult] = useState<EnhancedResult | null>(null);
  const [generatingEnhanced, setGeneratingEnhanced] = useState(false);
  const [enhancedError, setEnhancedError] = useState("");
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  const [gaps, setGaps] = useState<Gap[] | null>(null);
  const [checkingGaps, setCheckingGaps] = useState(false);
  const [gapAnswers, setGapAnswers] = useState<Record<string, string>>({});
  const [skippedGaps, setSkippedGaps] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedCV = useSavedCV();

  // Pre-fill CV textarea when saved CV loads
  useEffect(() => {
    if (!savedCV.loading && savedCV.cvText && !cvText) {
      setCvText(savedCV.cvText);
    }
  }, [savedCV.loading, savedCV.cvText]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await savedCV.uploadCV(file);
    // uploadCV updates savedCV.cvText; sync into local textarea state
    e.target.value = "";
  }

  // Keep textarea in sync when savedCV.cvText updates after upload/remove
  useEffect(() => {
    if (!savedCV.loading) {
      setCvText(savedCV.cvText);
    }
  }, [savedCV.cvText, savedCV.loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetRole.trim() || cvText.trim().length < 50) return;
    setLoading(true);
    setError("");
    setResult(null);
    setEnhancedResult(null);
    setRejectedIds(new Set());
    setEnhancedError("");
    setGaps(null);
    setGapAnswers({});
    setSkippedGaps(new Set());
    try {
      const res = await fetch("/api/career-docs/cv-enhancer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole, industry, cvText, jobDescription }),
      });
      const data = await res.json() as { result?: CVResult; error?: string; upgrade?: boolean };
      if (!res.ok) {
        if (data.upgrade) { setUpgrade(true); return; }
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setResult(data.result!);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  async function handleCheckGaps() {
    if (!result) return;
    setCheckingGaps(true);
    setGaps(null);
    setGapAnswers({});
    setSkippedGaps(new Set());
    setEnhancedResult(null);
    setRejectedIds(new Set());
    setEnhancedError("");
    try {
      const res = await fetch("/api/career-docs/cv-enhancer/gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole, industry, cvText, jobDescription,
          analysis: {
            quickWins: result.quickWins,
            enhancedBullets: result.enhancedBullets,
            missingKeywords: result.missingKeywords,
            sections: result.sections,
            biggestGap: result.biggestGap,
            topStrength: result.topStrength,
          },
        }),
      });
      const data = await res.json() as { gaps?: Gap[] };
      const fetchedGaps = data.gaps ?? [];
      setGaps(fetchedGaps);
      if (fetchedGaps.length === 0) {
        void handleGenerateEnhanced([]);
      }
    } catch {
      setGaps([]);
      void handleGenerateEnhanced([]);
    } finally {
      setCheckingGaps(false);
    }
  }

  async function handleGenerateEnhanced(userGapAnswers: { id: string; answer: string }[]) {
    if (!result) return;
    setGeneratingEnhanced(true);
    setEnhancedError("");
    setEnhancedResult(null);
    setRejectedIds(new Set());
    try {
      const res = await fetch("/api/career-docs/cv-enhancer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          industry,
          cvText,
          jobDescription,
          userGapAnswers,
          analysis: {
            quickWins: result.quickWins,
            enhancedBullets: result.enhancedBullets,
            missingKeywords: result.missingKeywords,
            sections: result.sections,
            biggestGap: result.biggestGap,
            topStrength: result.topStrength,
          },
        }),
      });
      const data = await res.json() as { result?: EnhancedResult; error?: string; upgrade?: boolean };
      if (!res.ok) {
        if (data.upgrade) { setUpgrade(true); return; }
        setEnhancedError(data.error ?? "Something went wrong.");
        return;
      }
      setEnhancedResult(data.result!);
    } catch {
      setEnhancedError("Could not reach the server. Please try again.");
    } finally {
      setGeneratingEnhanced(false);
    }
  }

  function toggleRejection(id: string) {
    setRejectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function assembleFinalCV(fullCV: string, changes: Change[], rejected: Set<string>): string {
    let cv = fullCV;
    for (const change of changes) {
      if (rejected.has(change.id)) {
        cv = cv.replace(change.replacement, change.original);
      }
    }
    return cv;
  }

  if (upgrade) {
    return (
      <CandidateAppShell currentPath="/career-docs">
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mb-6 text-4xl">🔒</div>
          <h1 className="text-2xl font-bold text-white">Professional plan required</h1>
          <p className="mt-3 text-sm leading-7 text-gray-400">
            CV Enhancer is available on the Professional plan. Upgrade to unlock CV analysis,
            cover letters, and personal statement generation.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/pricing"
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg"
            >
              See plans →
            </Link>
            <Link
              href="/career-docs"
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3.5 text-center text-sm font-bold text-white"
            >
              Back to Career Docs
            </Link>
          </div>
        </div>
      </CandidateAppShell>
    );
  }

  return (
    <CandidateAppShell currentPath="/career-docs">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/career-docs" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-300 transition">
            ← Career Docs
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-400/25 bg-purple-400/10 text-purple-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-wide text-purple-300">AI Analysis</p>
              <h1 className="text-2xl font-bold tracking-tight text-white">CV Enhancer</h1>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[480px_1fr]">
          {/* Input panel */}
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-400">Target role *</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Product Manager"
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/20"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-400">Industry / sector</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Financial Services"
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/20"
                />
              </div>

              {/* CV field with saved-profile panel */}
              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-400">
                  Your CV *
                  <span className="ml-2 text-[10px] font-semibold normal-case tracking-normal text-gray-600">paste plain text or upload a file</span>
                </label>

                {/* Saved CV banner */}
                {!savedCV.loading && (
                  <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-purple-400/20 bg-purple-400/[0.06] px-3 py-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-purple-400">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="flex-1 truncate text-[11px] font-semibold text-purple-300">
                      {savedCV.hasSavedCV
                        ? savedCV.cvFileName
                          ? `Saved CV: ${savedCV.cvFileName}`
                          : "Loaded from saved profile CV"
                        : "No saved CV. Upload one to save it to your profile"}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={savedCV.uploading}
                        className="rounded-lg border border-purple-400/30 bg-purple-400/10 px-2.5 py-1 text-[10px] font-bold text-purple-300 transition hover:bg-purple-400/20 disabled:opacity-50"
                      >
                        {savedCV.uploading ? "Uploading…" : savedCV.hasSavedCV ? "Replace" : "Upload"}
                      </button>
                      {savedCV.hasSavedCV && (
                        <button
                          type="button"
                          onClick={() => void savedCV.removeCV()}
                          disabled={savedCV.removing}
                          className="rounded-lg border border-red-400/30 bg-red-400/[0.08] px-2.5 py-1 text-[10px] font-bold text-red-400 transition hover:bg-red-400/20 disabled:opacity-50"
                        >
                          {savedCV.removing ? "Removing…" : "Remove"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Hidden file input */}
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

                <textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste your full CV here, including all sections: summary, experience, education, skills…"
                  rows={12}
                  maxLength={15000}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/20 resize-y"
                  required
                />
                <p className="mt-1 text-right text-[10px] text-gray-600">{cvText.length.toLocaleString()} / 15,000 chars</p>

                {/* Unsaved-edits bar: the textarea is freely editable, so give
                    edits an explicit route back into the saved profile CV. */}
                {!savedCV.loading && cvText.trim().length > 0 && cvText.trim() !== savedCV.cvText.trim() && (
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2">
                    <span className="text-[11px] font-semibold text-amber-200">
                      {savedCV.hasSavedCV ? "You've edited your saved CV." : "Save this CV to your profile for next time."}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {savedCV.hasSavedCV && (
                        <button
                          type="button"
                          onClick={() => setCvText(savedCV.cvText)}
                          className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-gray-400 transition hover:text-white"
                        >
                          Undo edits
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void savedCV.saveText(cvText)}
                        disabled={savedCV.saving}
                        className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-50"
                      >
                        {savedCV.saving ? "Saving…" : "Save to profile"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowJd((v) => !v)}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 transition"
              >
                {showJd ? "▲ Hide" : "▼ Add"} job description (optional, improves ATS matching)
              </button>

              {showJd && (
                <div>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here for targeted ATS keyword analysis…"
                    rows={6}
                    maxLength={8000}
                    className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/20 resize-y"
                  />
                  <p className="mt-1 text-right text-[10px] text-gray-600">{jobDescription.length} / 8000 chars</p>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !targetRole.trim() || cvText.trim().length < 50}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold transition-all ${
                !loading && targetRole.trim() && cvText.trim().length >= 50
                  ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg hover:scale-[1.01]"
                  : "cursor-not-allowed bg-white/[0.05] text-gray-600"
              }`}
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analysing your CV…
                </>
              ) : "Analyse my CV →"}
            </button>
          </form>

          {/* Results panel */}
          <div className="space-y-4">
            {!result && !loading && (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-dashed border-white/[0.08] text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-400/[0.06] text-purple-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
                    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Your CV analysis will appear here</p>
              </div>
            )}

            {loading && (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04]">
                <svg className="h-8 w-8 animate-spin text-purple-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-400">Analysing your CV against the role…</p>
              </div>
            )}

            {result && (
              <>
                {/* Overall score */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    <ScoreRing score={result.overallScore} />
                    <div className="text-center sm:text-left">
                      <p className="text-xs font-bold tracking-wide text-gray-500">Overall CV score</p>
                      <p className="mt-1 text-lg font-bold text-white">{result.overallLabel}</p>
                      <p className="mt-2 text-sm leading-6 text-gray-300">{result.summary}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
                      <p className="text-[10px] font-bold tracking-wide text-emerald-400">Top strength</p>
                      <p className="mt-1 text-sm text-gray-300">{result.topStrength}</p>
                    </div>
                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3">
                      <p className="text-[10px] font-bold tracking-wide text-amber-400">Biggest gap</p>
                      <p className="mt-1 text-sm text-gray-300">{result.biggestGap}</p>
                    </div>
                  </div>
                </div>

                {/* Quick wins */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
                  <p className="mb-4 text-[11px] font-bold tracking-wide text-purple-300">Quick wins: do these first</p>
                  <ol className="space-y-2.5">
                    {result.quickWins.map((w, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-400/20 text-[10px] font-bold text-purple-300">{i + 1}</span>
                        {w}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Section breakdown */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
                  <p className="mb-4 text-[11px] font-bold tracking-wide text-gray-400">Section breakdown</p>
                  <div className="space-y-5">
                    {result.sections.map((s, i) => (
                      <div key={i}>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-white">{s.name}</span>
                        </div>
                        <ScoreBar score={s.score} />
                        <p className="mt-2 text-xs leading-5 text-gray-400">{s.feedback}</p>
                        <p className="mt-1 text-xs leading-5 text-purple-300">→ {s.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced bullets */}
                {result.enhancedBullets.length > 0 && (
                  <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
                    <p className="mb-4 text-[11px] font-bold tracking-wide text-cyan-300">Rewritten bullet points</p>
                    <div className="space-y-5">
                      {result.enhancedBullets.map((b, i) => (
                        <div key={i} className="space-y-2">
                          <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                            <p className="text-[10px] font-bold tracking-wide text-gray-600 mb-1">Before</p>
                            <p className="text-xs leading-5 text-gray-500 line-through">{b.original}</p>
                          </div>
                          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2">
                            <div className="mb-1 flex items-center justify-between gap-3">
                              <p className="text-[10px] font-bold tracking-wide text-emerald-400">After</p>
                              <button
                                onClick={() => copyText(b.enhanced, `bullet-${i}`)}
                                className="shrink-0 rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-gray-400 hover:text-white transition"
                              >
                                {copied === `bullet-${i}` ? "Copied!" : "Copy"}
                              </button>
                            </div>
                            <p className="text-xs leading-5 text-gray-200">{b.enhanced}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords + ATS */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
                    <p className="mb-3 text-[11px] font-bold tracking-wide text-amber-300">Keywords to add</p>
                    <div className="flex flex-wrap gap-2">
                      {result.missingKeywords.map((kw, i) => (
                        <span key={i} className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-200">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
                    <p className="mb-3 text-[11px] font-bold tracking-wide text-blue-300">ATS tips</p>
                    <ul className="space-y-2">
                      {result.atsTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <span className="mt-0.5 text-blue-400">✓</span>{tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Enhanced CV generator (full-width, below analysis grid) ── */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* Phase 0: Initial CTA */}
            {!checkingGaps && gaps === null && !generatingEnhanced && !enhancedResult && (
              <div className="rounded-[1.75rem] border border-purple-400/25 bg-gradient-to-br from-purple-500/[0.09] to-fuchsia-500/[0.04] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="mb-1 text-[10px] font-bold tracking-wide text-purple-400">Pro feature</p>
                    <h2 className="text-lg font-bold tracking-tight text-white">Generate Enhanced CV</h2>
                    <p className="mt-1 text-sm leading-6 text-gray-400">
                      We'll ask for any missing details first, apply all recommendations, then let you accept or reject each change.
                    </p>
                  </div>
                  <button
                    onClick={() => void handleCheckGaps()}
                    className="shrink-0 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.02]"
                  >
                    Generate Enhanced CV →
                  </button>
                </div>
              </div>
            )}

            {/* Phase 1: Checking gaps */}
            {checkingGaps && (
              <div className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04]">
                <svg className="h-6 w-6 animate-spin text-purple-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-400">Checking what we need from you…</p>
              </div>
            )}

            {/* Phase 2: Gap form */}
            {gaps !== null && gaps.length > 0 && !generatingEnhanced && !enhancedResult && (
              <div className="rounded-[1.75rem] border border-purple-400/20 bg-white/[0.03] p-6">
                <div className="mb-5">
                  <p className="text-[11px] font-bold tracking-wide text-purple-300">Before we generate</p>
                  <p className="mt-1 text-sm leading-6 text-gray-400">
                    The AI found {gaps.length} area{gaps.length !== 1 ? "s" : ""} where extra detail would strengthen your CV.
                    Answer what you can, and skip anything you prefer to leave as-is.
                  </p>
                </div>
                <div className="space-y-4">
                  {gaps.map((gap) => {
                    const skipped = skippedGaps.has(gap.id);
                    return (
                      <div
                        key={gap.id}
                        className={`rounded-xl border p-4 transition ${skipped ? "border-white/[0.05] opacity-40" : "border-white/[0.1]"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="mb-0.5 text-[10px] font-bold tracking-wide text-purple-400">{gap.section}</p>
                            <p className="text-sm font-semibold text-white">{gap.question}</p>
                            {!skipped && (
                              <textarea
                                value={gapAnswers[gap.id] ?? ""}
                                onChange={(e) => setGapAnswers((prev) => ({ ...prev, [gap.id]: e.target.value }))}
                                placeholder={gap.hint}
                                rows={2}
                                className="mt-2 w-full resize-none rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/20"
                              />
                            )}
                          </div>
                          <button
                            onClick={() =>
                              setSkippedGaps((prev) => {
                                const next = new Set(prev);
                                if (next.has(gap.id)) next.delete(gap.id);
                                else next.add(gap.id);
                                return next;
                              })
                            }
                            className="mt-0.5 shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold text-gray-500 transition hover:text-gray-300"
                          >
                            {skipped ? "Restore" : "Skip"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => { setGaps(null); setGapAnswers({}); setSkippedGaps(new Set()); }}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-bold text-gray-400 transition hover:text-white"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      const answers = gaps
                        .filter((g) => !skippedGaps.has(g.id) && (gapAnswers[g.id] ?? "").trim())
                        .map((g) => ({ id: g.id, answer: gapAnswers[g.id] }));
                      void handleGenerateEnhanced(answers);
                    }}
                    className="rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.01]"
                  >
                    Generate Enhanced CV →
                  </button>
                </div>
              </div>
            )}

            {/* Phase 3: Generating */}
            {generatingEnhanced && (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04]">
                <svg className="h-8 w-8 animate-spin text-purple-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-400">Rewriting your CV and tracking changes…</p>
                <p className="text-xs text-gray-600">This takes around 30–45 seconds</p>
              </div>
            )}

            {enhancedError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{enhancedError}</div>
            )}

            {/* Results */}
            {enhancedResult && (
              <div className="space-y-4">
                {/* Change review cards */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] font-bold tracking-wide text-purple-300">
                      {enhancedResult.changes.length} changes: accept or reject each
                    </p>
                    <div className="flex gap-2">
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                        {enhancedResult.changes.length - rejectedIds.size} accepted
                      </span>
                      <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-[10px] font-bold text-red-300">
                        {rejectedIds.size} rejected
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {enhancedResult.changes.map((change) => {
                      const rejected = rejectedIds.has(change.id);
                      return (
                        <div
                          key={change.id}
                          className={`rounded-xl border p-4 transition ${
                            rejected
                              ? "border-red-500/25 bg-red-500/[0.05]"
                              : "border-emerald-400/20 bg-emerald-400/[0.04]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="mb-2 text-[10px] font-bold tracking-wide text-gray-500">
                                {change.section}
                              </p>
                              <div className="space-y-2">
                                <div className="rounded-lg bg-black/20 px-3 py-2">
                                  <p className="mb-0.5 text-[9px] font-bold tracking-wide text-gray-600">Before</p>
                                  <p className="text-xs leading-5 text-gray-500 line-through">{change.original}</p>
                                </div>
                                <div className="rounded-lg bg-black/20 px-3 py-2">
                                  <p className="mb-0.5 text-[9px] font-bold tracking-wide text-emerald-500">After</p>
                                  <p className="text-xs leading-5 text-gray-200">{change.replacement}</p>
                                </div>
                              </div>
                              <p className="mt-2 text-[10px] leading-4 text-gray-500">→ {change.reason}</p>
                            </div>
                            <button
                              onClick={() => toggleRejection(change.id)}
                              className={`shrink-0 rounded-lg border px-3 py-1.5 text-[10px] font-bold transition ${
                                rejected
                                  ? "border-red-400/40 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                                  : "border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                              }`}
                            >
                              {rejected ? "Rejected" : "Accepted"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Flagged — needs user input */}
                {enhancedResult.flagged.length > 0 && (
                  <div className="rounded-[1.75rem] border border-amber-400/20 bg-amber-400/[0.04] p-6">
                    <p className="mb-3 text-[11px] font-bold tracking-wide text-amber-300">
                      Needs your input (couldn't auto-apply)
                    </p>
                    <div className="space-y-2.5">
                      {enhancedResult.flagged.map((f, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                          <span className="mt-0.5 shrink-0 text-amber-400">!</span>
                          <span>
                            <span className="font-bold text-amber-200">{f.section}:</span>{" "}
                            {f.note}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final CV preview + copy */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold tracking-wide text-cyan-300">Your enhanced CV</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {enhancedResult.changes.length - rejectedIds.size} of {enhancedResult.changes.length} changes applied
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const finalCV = assembleFinalCV(
                            enhancedResult.fullEnhancedCV,
                            enhancedResult.changes,
                            rejectedIds
                          );
                          void navigator.clipboard.writeText(finalCV).then(() => {
                            setCopied("final-cv");
                            setTimeout(() => setCopied(null), 2000);
                          });
                        }}
                        className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-[11px] font-bold text-cyan-300 transition hover:bg-cyan-400/20"
                      >
                        {copied === "final-cv" ? "Copied!" : "Copy final CV"}
                      </button>
                      <button
                        onClick={() => {
                          setEnhancedResult(null);
                          setRejectedIds(new Set());
                          // Return to gap form if there were questions, else back to CTA
                          if (!gaps || gaps.length === 0) setGaps(null);
                        }}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-bold text-gray-400 transition hover:text-white"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-[600px] overflow-y-auto rounded-xl border border-white/[0.06] bg-black/20 p-5 font-sans text-xs leading-6 text-gray-300 whitespace-pre-wrap">
                    {assembleFinalCV(
                      enhancedResult.fullEnhancedCV,
                      enhancedResult.changes,
                      rejectedIds
                    )}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </CandidateAppShell>
  );
}
