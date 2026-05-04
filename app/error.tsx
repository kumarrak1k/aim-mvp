"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#07030d] text-white">
      <div className="relative flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
        <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[620px] w-[920px] -translate-x-1/2 rounded-full bg-purple-700/30 blur-[140px]" />
        <div className="pointer-events-none absolute right-[-220px] top-24 h-[460px] w-[460px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute left-[-220px] top-80 h-[420px] w-[420px] rounded-full bg-fuchsia-500/15 blur-[120px]" />

        <section className="relative w-full max-w-3xl overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.07] p-6 text-center shadow-2xl shadow-purple-950/20 backdrop-blur-2xl sm:p-8 md:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          <div className="mx-auto mb-6 w-fit rounded-[1.5rem] border border-white/15 bg-white p-2 shadow-2xl shadow-purple-950/40">
            <img
              src="/brand/logo.jpg"
              alt="AI Career Mentor"
              className="h-16 w-16 rounded-2xl object-contain"
            />
          </div>

          <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-red-300">
            Something went wrong
          </p>

          <h1 className="text-4xl font-black tracking-[-0.055em] md:text-6xl">
            The coach hit a temporary issue.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-gray-300">
            This can happen during a temporary network, browser, or server issue.
            Try again first. If it keeps happening, return to the practice page
            and start a fresh session.
          </p>

          {error.digest && (
            <p className="mx-auto mt-5 w-fit rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-bold text-gray-500">
              Error reference: {error.digest}
            </p>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={reset}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] sm:w-auto"
            >
              Try again
            </button>

            <Link href="/practice">
              <button className="w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-7 py-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 sm:w-auto">
                Go to practice
              </button>
            </Link>

            <Link href="/">
              <button className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-7 py-4 text-sm font-black text-white transition hover:bg-white/[0.1] sm:w-auto">
                Homepage
              </button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
