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
    <div className="min-h-screen bg-[#120d1e] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(140,92,255,0.15),transparent_35%),linear-gradient(180deg,#120d1e_0%,#171224_100%)]" />

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

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/progress">
            <button className="rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.10]">
              View your saved results
            </button>
          </Link>
          <Link href="/">
            <button className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-black text-gray-300 transition hover:bg-white/[0.07]">
              Explore AI Career Mentor
            </button>
          </Link>
        </div>

        <p className="mt-12 text-center text-xs text-gray-600">
          You can practise more interviews any time at{" "}
          <Link href="/practice" className="text-gray-500 hover:text-gray-400">
            /practice
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
