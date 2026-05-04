"use client";

import Link from "next/link";
import {
  GlassCard,
  MarketingShell,
  SectionHeading,
} from "../components/marketing/MarketingShell";

const steps = [
  {
    step: "01",
    title: "Set up the interview",
    text: "Choose your role, level, interview type and focus so the experience is targeted to your situation.",
  },
  {
    step: "02",
    title: "Answer the question",
    text: "Listen to the question, then respond naturally by voice or by typing if preferred.",
  },
  {
    step: "03",
    title: "Review feedback",
    text: "See where your answer is strong and where you can improve structure, clarity, relevance and delivery.",
  },
  {
    step: "04",
    title: "Repeat with purpose",
    text: "Use the insight to improve your next answer and build stronger interview habits over time.",
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingShell currentPath="/how-it-works">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionHeading
              eyebrow="How it works"
              title="A simple, high-quality loop for better interview performance."
              description="The product is designed to reduce friction. Each step is clear, focused and directly connected to better answers and better delivery."
            />
          </div>

          <GlassCard className="overflow-hidden p-0">
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80"
              alt="Professional reviewing a workflow on a laptop"
              className="h-full min-h-[360px] w-full object-cover"
            />
          </GlassCard>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((item) => (
            <div
              key={item.step}
              className="rounded-[1.8rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-black/10"
            >
              <p className="mb-5 text-sm font-black text-cyan-300">{item.step}</p>
              <h3 className="text-xl font-black tracking-[-0.03em]">
                {item.title}
              </h3>
              <p className="mt-3 leading-7 text-gray-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <GlassCard className="overflow-hidden p-0">
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80"
              alt="Candidate receiving coaching and feedback"
              className="h-full min-h-[360px] w-full object-cover"
            />
          </GlassCard>

          <GlassCard>
            <SectionHeading
              eyebrow="Outcome"
              title="The result is clearer practice and faster improvement."
              description="Instead of generic tips, candidates leave each session with specific feedback, a better understanding of how they came across and a more useful next step."
            />

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/practice">
                <button className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-base font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.02] sm:w-auto">
                  Try the workflow
                </button>
              </Link>
              <Link href="/platform">
                <button className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-7 py-4 text-base font-black text-white transition hover:bg-white/[0.1] sm:w-auto">
                  Explore platform
                </button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>
    </MarketingShell>
  );
}