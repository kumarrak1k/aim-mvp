"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* HEADER */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/brand/logo.png"
              alt="AI Career Mentor"
              className="h-10 w-10"
            />
            <span className="text-lg font-semibold tracking-tight">
              AI Career Mentor
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.1]">
                  Sign In
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <UserButton />
            </Show>

            <Link href="/practice">
              <button className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-purple-100">
                Start Practice
              </button>
            </Link>
          </div>
        </header>

        {/* HERO */}
        <section className="mb-10">
          <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">
            Practice like the interview already matters
          </h1>

          <p className="max-w-xl text-gray-400">
            Real interview questions. Voice and video feedback. AI coaching that
            pushes you to an 8+/10 answer.
          </p>
        </section>

        {/* FEATURES */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="mb-2 font-semibold text-purple-300">
              Voice Analysis
            </h3>
            <p className="text-sm text-gray-400">
              Pace, fillers, confidence and energy scored in real time.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="mb-2 font-semibold text-cyan-300">
              Video Feedback
            </h3>
            <p className="text-sm text-gray-400">
              Eye contact, posture, expression and engagement analysed live.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="mb-2 font-semibold text-green-300">
              AI Coaching
            </h3>
            <p className="text-sm text-gray-400">
              Section-by-section feedback with a stronger 8+/10 model answer.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-10 text-center">
          <Link href="/practice">
            <button className="rounded-full bg-purple-600 px-8 py-3 font-semibold hover:bg-purple-700">
              Start your interview now
            </button>
          </Link>
        </section>
      </div>
    </main>
  );
}