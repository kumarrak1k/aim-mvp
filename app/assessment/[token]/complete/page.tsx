"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type CompletionData = {
  company: { name: string; brandColor: string };
  template: { name: string; role: string };
};

/**
 * Shown after an assessment candidate finishes their interview.
 *
 * The /api/assessment/[token] GET will return 409 "already completed" once
 * the assignment has been marked done — we use that as the signal that the
 * submission really did land. Falls back to a generic confirmation if the
 * lookup fails (better UX than showing an error after a successful interview).
 */
export default function AssessmentCompletePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<CompletionData | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/assessment/${token}`);
        const json = await res.json();
        if (cancelled) return;

        // 409 = "already completed" — that's the success signal here.
        if (res.status === 409 || (json.assignment && json.assignment.status === "completed")) {
          setConfirmed(true);
        }

        if (json.company && json.template) {
          setData({ company: json.company, template: json.template });
        }
      } catch {
        // Silent — we still show the generic thank-you below.
      }
    }
    if (token) void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const brand = data?.company.brandColor || "#8c5cff";

  return (
    <div className="min-h-screen bg-[#0a0614] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.18] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.18] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-16 sm:px-6">
        {/* Brand emblem */}
        {data?.company && (
          <div
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-xl"
            style={{ background: brand }}
          >
            {data.company.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Tick */}
        <div
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-full text-4xl shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${brand}, #6c4cff)`,
            boxShadow: `0 14px 40px ${brand}55`,
          }}
        >
          ✓
        </div>

        <p className="text-sm font-black uppercase tracking-[0.22em] text-gray-400">
          Assessment complete
        </p>

        <h1 className="mt-3 max-w-xl text-center text-3xl font-black tracking-[-0.05em] sm:text-4xl">
          {confirmed ? "Thanks — your assessment is in." : "Thanks for completing the assessment."}
        </h1>

        <p className="mt-4 max-w-xl text-center text-base leading-7 text-gray-300">
          {data?.company
            ? `Your full results have been sent to ${data.company.name}'s hiring team. They'll be in touch with the next step in their process.`
            : "Your results have been sent to the hiring team. They'll be in touch with the next step in their process."}
        </p>

        {data?.template && (
          <div className="mt-8 w-full max-w-md rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
              You completed
            </p>
            <p className="mt-2 text-base font-black text-white">{data.template.name}</p>
            <p className="mt-1 text-sm text-gray-400">{data.template.role}</p>
          </div>
        )}

        {/* Pivot the candidate to AI Career Mentor as a personal product —
            but DO NOT offer a way back to the company assessment results.
            That data belongs to the hiring team only. */}
        <div className="mt-10 w-full max-w-md rounded-[1.5rem] border border-purple-500/[0.18] bg-purple-500/[0.05] p-5 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
            What happens next
          </p>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            {data?.company
              ? `${data.company.name}'s hiring team will review your responses and follow up directly. Your scoring and feedback are shared only with them.`
              : "The hiring team will review your responses and follow up directly. Your scoring and feedback are shared only with them."}
          </p>
        </div>

        <div className="mt-8 w-full max-w-md rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
            While you wait
          </p>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            AI Career Mentor also helps candidates prepare for their own
            interviews and assessment centres. Try it for the next role you
            apply for.
          </p>
          <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/for-candidates"
              className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.02] sm:w-auto"
            >
              Explore AI Career Mentor →
            </Link>
            <Link
              href="/for-candidates/sign-up"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/[0.08] sm:w-auto"
            >
              Start free
            </Link>
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-gray-600">
          You can safely close this tab.
        </p>
      </div>
    </div>
  );
}
