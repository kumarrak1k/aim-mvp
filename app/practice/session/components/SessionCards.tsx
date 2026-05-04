"use client";

import Link from "next/link";

export function LoadingSessionCard({ message }: { message: string }) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.055] p-8 text-center shadow-2xl shadow-purple-950/20 backdrop-blur-2xl">
        <div className="mx-auto mb-5 h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-purple-400/50 to-cyan-300/35" />
        <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
          Practice session
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.045em]">
          {message}
        </h1>
      </div>
    </section>
  );
}

export function MissingSessionCard() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.055] p-8 text-center shadow-2xl shadow-purple-950/20 backdrop-blur-2xl">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">
          Setup required
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.045em]">
          Start from the practice setup page.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-gray-300">
          Your interview workspace needs the role, interview type and practice
          mode selected on the setup page.
        </p>
        <Link href="/practice">
          <button className="mt-7 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.02]">
            Return to setup
          </button>
        </Link>
      </div>
    </section>
  );
}