"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { GlassCard } from "@/app/components/marketing/primitives";

export function ProfileLoadingState() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
      <GlassCard className="overflow-hidden">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
            Preparing profile
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-white">
            Loading your candidate workspace.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-gray-300">
            We are checking whether you already have saved CV context, a target
            role and interview goals.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["CV context", "Role targeting", "Interview goals"].map((item) => (
            <div
              key={item}
              className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"
            >
              <div className="h-3 w-20 rounded-full bg-white/10" />
              <div className="mt-5 h-4 w-3/4 rounded-full bg-white/10" />
              <div className="mt-3 h-4 w-1/2 rounded-full bg-white/10" />
              <p className="mt-5 text-sm font-semibold text-gray-400">
                {item}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  );
}

export function ProfileSignedOutState() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
      <GlassCard>
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
              Save your context
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">
              Sign in to make every mock interview more personal.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-gray-300">
              Your candidate profile stores CV context, target role details and
              interview goals so AI Career Mentor can generate more relevant questions and
              more useful feedback.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                "Save CV context",
                "Target a role",
                "Practise smarter",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm font-bold text-gray-200"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <SignInButton mode="modal">
                <button className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]">
                  Sign in to save profile
                </button>
              </SignInButton>

              <Link
                href="/practice"
                className="rounded-2xl border border-white/10 bg-white/[0.07] px-7 py-4 text-center text-sm font-black text-white transition hover:bg-white/[0.12]"
              >
                Start without profile
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/25">
            <img
              src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80"
              alt="Premium candidate preparation workspace"
              className="h-[360px] w-full object-cover"
            />
          </div>
        </div>
      </GlassCard>
    </section>
  );
}