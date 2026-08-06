"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
import { useSavedCV } from "@/app/career-docs/hooks/useSavedCV";

type CoverLetterResult = {
  letter: string;
  wordCount: number;
  subject: string;
  keyThemes: string[];
  customisationTips: string[];
};

type Tone = "professional" | "enthusiastic" | "concise";

const toneOptions: { value: Tone; label: string; desc: string }[] = [
  { value: "professional", label: "Professional", desc: "Formal, polished, quietly confident" },
  { value: "enthusiastic", label: "Enthusiastic", desc: "Warm, energetic, genuinely excited" },
  { value: "concise", desc: "Sharp, direct, no padding", label: "Concise" },
];

export default function CoverLetterPage() {
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [experience, setExperience] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [wordLimit, setWordLimit] = useState(350);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upgrade, setUpgrade] = useState(false);
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedCV = useSavedCV();

  // Pre-fill experience field when saved CV loads
  useEffect(() => {
    if (!savedCV.loading && savedCV.cvText && !experience) {
      setExperience(savedCV.cvText);
    }
  }, [savedCV.loading, savedCV.cvText]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep in sync after upload / remove
  useEffect(() => {
    if (!savedCV.loading) {
      setExperience(savedCV.cvText);
    }
  }, [savedCV.cvText, savedCV.loading]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await savedCV.uploadCV(file);
    e.target.value = "";
  }

  const canSubmit = companyName.trim() && jobTitle.trim() && jobDescription.trim().length >= 20 && jobDescription.length <= 10000 && experience.trim().length >= 20 && experience.length <= 15000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/career-docs/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, jobTitle, jobDescription, experience, tone, wordLimit }),
      });
      const data = await res.json() as { result?: CoverLetterResult; error?: string; details?: string[]; upgrade?: boolean };
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

  function copyLetter() {
    if (!result) return;
    navigator.clipboard.writeText(result.letter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  if (upgrade) {
    return (
      <CandidateAppShell currentPath="/career-docs">
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mb-6 text-4xl">🔒</div>
          <h1 className="text-2xl font-bold text-white">Professional plan required</h1>
          <p className="mt-3 text-sm leading-7 text-gray-400">
            Cover Letter Generator is available on the Professional plan.
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
          <Link href="/career-docs" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-300 transition">
            ← CV Studio
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-wide text-cyan-300">AI Generator</p>
              <h1 className="text-2xl font-bold tracking-tight text-white">Cover Letter Generator</h1>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[480px_1fr]">
          {/* Input */}
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-400">Company *</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Goldman Sachs"
                    className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-400">Job title *</label>
                  <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Analyst"
                    className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20" required />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-400">Job description *</label>
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job posting here. The more detail, the better for tailoring…"
                  rows={6}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 resize-y" required />
                <p className={`mt-1 text-right text-[10px] ${jobDescription.length > 10000 ? "text-red-400" : "text-gray-600"}`}>
                  {jobDescription.length.toLocaleString()} / 10,000 characters
                </p>
              </div>

              {/* Experience field with CV integration */}
              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-400">Your key experience *</label>

                {/* Saved CV banner */}
                {!savedCV.loading && (
                  <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] px-3 py-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-cyan-400">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="flex-1 truncate text-[11px] font-semibold text-cyan-300">
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
                        className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50"
                      >
                        {savedCV.uploading ? "Uploading…" : savedCV.hasSavedCV ? "Replace" : "Upload CV"}
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

                <textarea value={experience} onChange={(e) => setExperience(e.target.value)}
                  placeholder="Summarise your relevant experience: roles, key achievements, skills. Include numbers and specifics where possible…"
                  rows={5}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 resize-y" required />
                <p className={`mt-1 text-right text-[10px] ${experience.length > 15000 ? "text-red-400" : "text-gray-600"}`}>
                  {experience.length.toLocaleString()} / 15,000 characters
                </p>
              </div>

              {/* Tone */}
              <div>
                <label className="mb-2 block text-xs font-bold tracking-wide text-gray-400">Tone</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {toneOptions.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setTone(opt.value)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition ${
                        tone === opt.value
                          ? "border-cyan-400/40 bg-cyan-400/10 text-white"
                          : "border-white/[0.08] bg-white/[0.02] text-gray-500 hover:border-white/20 hover:text-gray-300"
                      }`}>
                      <p className="text-xs font-bold">{opt.label}</p>
                      <p className="text-[10px] mt-0.5 leading-4">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Word count */}
              <div>
                <label className="mb-2 flex items-center justify-between text-xs font-bold tracking-wide text-gray-400">
                  Word limit
                  <span className="text-white">{wordLimit} words</span>
                </label>
                <input type="range" min={200} max={600} step={50} value={wordLimit}
                  onChange={(e) => setWordLimit(Number(e.target.value))}
                  className="w-full accent-cyan-400" />
                <div className="mt-1 flex justify-between text-[10px] text-gray-600">
                  <span>200 (short)</span><span>600 (detailed)</span>
                </div>
              </div>
            </div>

            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

            <button type="submit" disabled={loading || !canSubmit}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold transition-all ${
                !loading && canSubmit
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg hover:scale-[1.01]"
                  : "cursor-not-allowed bg-white/[0.05] text-gray-600"
              }`}>
              {loading ? (
                <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Writing your letter…</>
              ) : "Generate cover letter →"}
            </button>
            {!loading && !canSubmit && (
              <p className="text-center text-[11px] leading-5 text-gray-500">
                To enable the button:{" "}
                {[
                  !companyName.trim() && "add the company name",
                  !jobTitle.trim() && "add the job title",
                  jobDescription.trim().length < 20 && "paste the job description (20+ characters)",
                  jobDescription.length > 10000 && "shorten the job description to 10,000 characters",
                  experience.trim().length < 20 && "add your key experience (20+ characters)",
                  experience.length > 15000 && "shorten your experience to 15,000 characters",
                ].filter(Boolean).join(" · ")}
              </p>
            )}
          </form>

          {/* Output */}
          <div className="space-y-4">
            {!result && !loading && (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-dashed border-white/[0.08] text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Your cover letter will appear here</p>
              </div>
            )}

            {loading && (
              <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04]">
                <svg className="h-8 w-8 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-400">Writing your tailored cover letter…</p>
              </div>
            )}

            {result && (
              <>
                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                    {result.wordCount} words
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-gray-300">
                    Subject: {result.subject}
                  </span>
                  <button onClick={copyLetter}
                    className="ml-auto rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[0.1]">
                    {copied ? "✓ Copied!" : "Copy letter"}
                  </button>
                </div>

                {/* Letter */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur-xl">
                  <p className="mb-3 text-[11px] font-bold tracking-wide text-cyan-300">Your cover letter</p>
                  <div className="whitespace-pre-line text-sm leading-8 text-gray-200">
                    {result.letter}
                  </div>
                </div>

                {/* Key themes */}
                <div className="rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl">
                  <p className="mb-3 text-[11px] font-bold tracking-wide text-gray-400">Key themes in this letter</p>
                  <div className="flex flex-wrap gap-2">
                    {result.keyThemes.map((t, i) => (
                      <span key={i} className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-bold text-purple-300">{t}</span>
                    ))}
                  </div>
                </div>

                {/* Customisation tips */}
                <div className="rounded-[1.75rem] border border-amber-400/[0.18] bg-amber-400/[0.05] p-5 backdrop-blur-xl">
                  <p className="mb-3 text-[11px] font-bold tracking-wide text-amber-300">Before you send, personalise it</p>
                  <ul className="space-y-2">
                    {result.customisationTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="mt-0.5 text-amber-400">→</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </CandidateAppShell>
  );
}
