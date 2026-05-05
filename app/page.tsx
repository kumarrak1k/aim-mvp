"use client";

import Link from "next/link";
import { SiteLogo } from "@/app/components/brand/SiteLogo";
import {
  BulletList,
  GlassCard,
  MarketingShell,
  PageLinkCard,
  SectionHeading,
} from "./components/marketing/MarketingShell";

const overviewCards = [
  {
    href: "/platform",
    eyebrow: "Platform",
    title: "A smarter coaching engine",
    description:
      "Tailored questions, natural audio, transcript review and performance scoring in one premium practice flow.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    href: "/how-it-works",
    eyebrow: "How it works",
    title: "A simple improvement loop",
    description:
      "Move from setup, to answering, to feedback, to measurable next steps without a long, cluttered journey.",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
  },
  {
    href: "/candidates",
    eyebrow: "Candidates",
    title: "Built for real career moments",
    description:
      "For graduates, career changers and professionals preparing for interviews that genuinely matter.",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    href: "/pricing",
    eyebrow: "Pricing",
    title: "Simple plans, clear value",
    description:
      "Choose the level of coaching support that matches how seriously you are preparing.",
    image:
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80",
  },
];

const readinessHighlights = [
  "Answer quality scoring",
  "Voice delivery review",
  "Camera presence feedback",
  "Saved progress history",
];

export default function Home() {
  return (
    <MarketingShell currentPath="/">
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-7 sm:px-6 sm:pb-16 sm:pt-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div className="text-center lg:text-left">
            <div className="mx-auto mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200 shadow-xl shadow-purple-950/20 lg:mx-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </span>
              Premium interview training
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl md:text-6xl lg:mx-0">
              Practise until your interview answers feel{" "}
              <span className="bg-gradient-to-r from-purple-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
                sharper, calmer and more convincing.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg sm:leading-8 lg:mx-0">
              AI Career Mentor helps you improve what interviewers actually
              notice: your answer quality, voice delivery, camera presence and
              ability to communicate under pressure.
            </p>

            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:justify-center lg:justify-start">
              <Link href="/practice">
                <button className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-base font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.02] sm:w-auto">
                  Start interview practice
                </button>
              </Link>

              <Link href="/progress">
                <button className="w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-7 py-4 text-base font-black text-cyan-100 transition hover:bg-cyan-300/15 sm:w-auto">
                  Track progress
                </button>
              </Link>
            </div>

            <div className="mt-6 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3 lg:mx-0">
              <StatCard value="5" label="questions" />
              <StatCard value="360°" label="feedback" />
              <StatCard value="8+" label="target" />
            </div>
          </div>

          <GlassCard className="overflow-hidden p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SiteLogo href="" size="md" showText={false} />

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-200/70">
                    Interview cockpit
                  </p>
                  <h2 className="text-lg font-black sm:text-xl">
                    Built for focused practice
                  </h2>
                </div>
              </div>

              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
                Ready
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 sm:p-5">
                <p className="text-sm text-gray-400">Practice loop</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-[-0.08em] sm:text-6xl">
                    5
                  </span>
                  <span className="mb-2 text-base font-black text-gray-500 sm:text-lg">
                    questions
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <ProgressLine label="Tailored questions" value={92} />
                  <ProgressLine label="Natural audio" value={86} />
                  <ProgressLine label="Transcript feedback" value={88} />
                  <ProgressLine label="Progress tracking" value={82} />
                </div>
              </div>

              <div className="hidden overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20 sm:block">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
                  alt="Candidates preparing for interviews"
                  className="h-full min-h-[240px] w-full object-cover"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InsightCard
                label="Session experience"
                text="Question, transcript and camera preview stay focused in one guided workspace."
              />
              <InsightCard
                label="Progress product"
                text="Completed sessions are saved so improvement is visible over time."
              />
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-14">
        <SectionHeading
          align="center"
          eyebrow="Explore"
          title="A focused route through the platform."
          description="Start practising quickly, then go deeper into profile setup, progress tracking and coaching features when you need them."
        />

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <PageLinkCard key={card.href} {...card} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <GlassCard>
            <SectionHeading
              eyebrow="Why it works"
              title="Designed to feel premium, focused and useful."
              description="The experience is built around a simple improvement loop: practise, get feedback, review progress, then repeat with sharper answers."
            />

            <div className="mt-6">
              <BulletList
                items={[
                  "Tailored interview questions based on role, level and focus.",
                  "Natural question audio with spoken-answer transcription.",
                  "Camera and voice delivery signals for realistic remote interviews.",
                  "Saved session history so progress is visible over time.",
                ]}
              />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {readinessHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-white/10 bg-black/25 p-4 text-sm font-semibold text-gray-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="overflow-hidden p-0">
            <img
              src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80"
              alt="Professional candidate using a laptop for interview preparation"
              className="h-full min-h-[320px] w-full object-cover"
            />
          </GlassCard>
        </div>
      </section>
    </MarketingShell>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-center shadow-xl shadow-black/10 sm:p-4">
      <p className="text-2xl font-black tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-gray-400 sm:text-xs sm:leading-5">
        {label}
      </p>
    </div>
  );
}

function ProgressLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-sm font-black text-white">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 shadow-[0_0_20px_rgba(168,85,247,0.45)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function InsightCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
        {label}
      </p>
      <p className="text-sm leading-6 text-gray-300">{text}</p>
    </div>
  );
}