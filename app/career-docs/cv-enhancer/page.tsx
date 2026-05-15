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
        <span className="text-4xl font-black" style={{ color: col }}>{score}</span>
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
      <span className="w-6 text-right text-xs font-black text-white">{score}</span>
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

  if (upgrade) {
    return (
      <CandidateAppShell currentPath="/career-docs">
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mb-6 text-5xl">🔒</div>
          <h1 className="text-2xl font-black text-white">Professional plan required</h1>
          <p className="mt-3 text-sm leading-7 text-gray-400">
            CV Enhancer is available on the Professional plan. Upgrade to unlock CV analysis,
            cover letters, and personal statement generation.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/for-candidates/pricing">
              <button className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-3.5 text-sm font-black text-white shadow-lg">
                See plans →
              </button>
            </Link>
            <Link href="/career-docs">
              <button className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3.5 text-sm font-black text-white">
                Back to Career Docs
              </button>
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
          <Link href="/career-docs" className="mb-4 inline-flex items-center gap-1.5 text-xs font-black text-gray-500 hover:text-gray-300 transition">
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
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-purple-300">AI Analysis</p>
              <h1 className="text-2xl font-black tracking-[-0.04em] text-white">CV Enhancer</h1>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[480px_1fr]">
          {/* Input panel */}
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.18em] text-gray-400">Target role *</label>
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
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.18em] text-gray-400">Industry / sector</label>
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
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.18em] text-gray-400">
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
                        : "No saved CV — upload one to save it to your profile"}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={savedCV.uploading}
                        className="rounded-lg border border-purple-400/30 bg-purple-400/10 px-2.5 py-1 text-[10px] font-black text-purple-300 transition hover:bg-purple-400/20 disabled:opacity-50"
                      >
                        {savedCV.uploading ? "Uploading…" : savedCV.hasSavedCV ? "Replace" : "Upload"}
                      </button>
                      {savedCV.hasSavedCV && (
                        <button
                          type="button"
                          onClick={() => void savedCV.removeCV()}
                          disabled={savedCV.removing}
                          className="rounded-lg border border-red-400/30 bg-red-400/[0.08] px-2.5 py-1 text-[10px] font-black text-red-400 transition hover:bg-red-400/20 disabled:opacity-50"
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
                  placeholder="Paste your full CV here — include all sections: summary, experience, education, skills…"
                  rows={12}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/20 resize-y"
                  required
                />
                <p className="mt-1 text-right text-[10px] text-gray-600">{cvText.length} / 8000 chars</p>
              </div>

              <button
                type="button"
                onClick={() => setShowJd((v) => !v)}
                className="text-xs font-black text-purple-400 hover:text-purple-300 transition"
              >
                {showJd ? "▲ Hide" : "▼ Add"} job description (optional — improves ATS matching)
              </button>

              {showJd && (
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here for targeted ATS keyword analysis…"
                  rows={6}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/20 resize-y"
                />
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !targetRole.trim() || cvText.trim().length < 50}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black transition-all ${
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
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">Overall CV score</p>
                      <p className="mt-1 text-lg font-black text-white">{result.overallLabel}</p>
                      <p className="mt-2 text-sm leading-6 text-gray-300">{result.summary}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">Top strength</p>
                      <p className="mt-1 text-sm text-gray-300">{result.topStrength}</p>
                    </div>
                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">Biggest gap</p>
                      <p className="mt-1 text-sm text-gray-300">{result.biggestGap}</p>
                    </div>
                  </div>
                </div>

                {/* Quick wins */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
                  <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-purple-300">Quick wins — do these first</p>
                  <ol className="space-y-2.5">
                    {result.quickWins.map((w, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-400/20 text-[10px] font-black text-purple-300">{i + 1}</span>
                        {w}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Section breakdown */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
                  <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">Section breakdown</p>
                  <div className="space-y-5">
                    {result.sections.map((s, i) => (
                      <div key={i}>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-white">{s.name}</span>
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
                    <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Rewritten bullet points</p>
                    <div className="space-y-5">
                      {result.enhancedBullets.map((b, i) => (
                        <div key={i} className="space-y-2">
                          <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-600 mb-1">Before</p>
                            <p className="text-xs leading-5 text-gray-500 line-through">{b.original}</p>
                          </div>
                          <div className="relative rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400 mb-1">After</p>
                            <p className="text-xs leading-5 text-gray-200">{b.enhanced}</p>
                            <button
                              onClick={() => copyText(b.enhanced, `bullet-${i}`)}
                              className="absolute right-2 top-2 rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] font-black text-gray-400 hover:text-white transition"
                            >
                              {copied === `bullet-${i}` ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords + ATS */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">Keywords to add</p>
                    <div className="flex flex-wrap gap-2">
                      {result.missingKeywords.map((kw, i) => (
                        <span key={i} className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-black text-amber-200">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">ATS tips</p>
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
      </div>
    </CandidateAppShell>
  );
}
