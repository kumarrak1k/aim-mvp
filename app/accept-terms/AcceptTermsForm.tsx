"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearStoredAttribution, readStoredAttribution } from "@/app/components/AttributionCapture";

type AcceptTermsFormProps = {
  version: string;
  nextPath: string;
};

const KEY_POINTS = [
  {
    title: "Coaching tool, not a hiring service",
    body: "AI Career Mentor is for interview practice and self-improvement. It is not a recruitment agency, employer, or career-decision platform.",
  },
  {
    title: "No employment guarantee",
    body: "Using AI Career Mentor does not guarantee any interview success, job offer, salary, or career outcome. Results depend on your own preparation, the role, and the employer.",
  },
  {
    title: "AI feedback is guidance, not advice",
    body: "Scores, feedback, model answers, and improvement plans are AI-generated and may be inaccurate or incomplete. They are not legal, financial, immigration, or professional career advice.",
  },
  {
    title: "Liability is limited",
    body: "To the fullest extent allowed by law, AI Career Mentor is not liable for lost opportunities, missed offers, or any indirect, consequential, or incidental loss arising from your use of the service. Total liability is capped at the fees you have paid us in the prior 12 months (or £100 if none). Nothing in these terms limits liability that cannot be excluded under English law.",
  },
  {
    title: "Your data and consent",
    body: "You control what you upload. We process your data per the Privacy Policy. You can export or delete your data from your profile at any time.",
  },
  {
    title: "Governing law",
    body: "These terms are governed by the laws of England and Wales, and any dispute is subject to the exclusive jurisdiction of the English courts.",
  },
];

export function AcceptTermsForm({ version, nextPath }: AcceptTermsFormProps) {
  const router = useRouter();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = acceptTerms && acceptPrivacy && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version,
          acceptTerms,
          acceptPrivacy,
          // First-touch acquisition snapshot — backup persistence path in
          // case the sign-up completion call was lost.
          attribution: readStoredAttribution(),
        }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setError(data?.error ?? "Could not record acceptance. Please try again.");
        setSubmitting(false);
        return;
      }

      // Snapshot persisted server-side (backup path) — consume it so a
      // future account from this browser doesn't inherit this one's source.
      clearStoredAttribution();

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0614] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.10),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.06),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-purple-950/30 backdrop-blur-2xl sm:p-9">
          <p className="mb-2 text-[12px] font-bold tracking-wide text-purple-300">
            One quick confirmation
          </p>
          <h1 className="text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl">
            Please confirm the Terms of Use and Privacy Policy.
          </h1>
          <p className="mt-4 text-sm leading-7 text-gray-400">
            Before you continue, we need to record your agreement to how
            AI Career Mentor works, what it does <em>not</em> do, and how we
            handle your data. This protects both of us and only takes a moment.
          </p>

          <div className="mt-7 space-y-3">
            {KEY_POINTS.map((point) => (
              <div
                key={point.title}
                className="rounded-2xl border border-white/[0.08] bg-black/25 p-4"
              >
                <h3 className="mb-1 text-sm font-bold text-white">{point.title}</h3>
                <p className="text-sm leading-6 text-gray-400">{point.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs leading-6 text-gray-400">
            Full text:{" "}
            <Link
              href="/terms"
              target="_blank"
              className="font-bold text-purple-300 hover:text-purple-200"
            >
              Terms of Use ↗
            </Link>{" "}
            ·{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="font-bold text-purple-300 hover:text-purple-200"
            >
              Privacy Policy ↗
            </Link>
          </p>

          <div className="mt-7 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.1] bg-black/30 p-4 transition hover:bg-black/40">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 cursor-pointer accent-purple-500"
              />
              <span className="text-sm leading-6 text-gray-200">
                I have read and agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-bold text-purple-300 underline hover:text-purple-200"
                >
                  Terms of Use
                </Link>{" "}
                , including the limitation of liability and that AI Career
                Mentor does not guarantee any job, offer, or interview outcome.
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.1] bg-black/30 p-4 transition hover:bg-black/40">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="mt-1 h-4 w-4 cursor-pointer accent-purple-500"
              />
              <span className="text-sm leading-6 text-gray-200">
                I have read and agree to the{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-bold text-purple-300 underline hover:text-purple-200"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-3 text-sm font-semibold text-red-200">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3.5 text-sm font-bold text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.005] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            {submitting ? "Recording acceptance..." : "Confirm and continue"}
          </button>

          <p className="mt-4 text-center text-[12px] text-gray-400">
            Version {version} · Your acceptance is recorded with a timestamp.
          </p>
        </div>
      </div>
    </main>
  );
}
