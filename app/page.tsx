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

const trustPillars = [
  {
    icon: "🔒",
    title: "Your data stays yours",
    text: "CV and answer data is never sold or shared with employers. You delete it whenever you want.",
  },
  {
    icon: "🎯",
    title: "Built for real interviews",
    text: "Questions adapt to your role, level and interview type — not generic prompts.",
  },
  {
    icon: "🎙️",
    title: "360° delivery coaching",
    text: "Answer quality, pace, filler words, eye contact and body language all reviewed together.",
  },
  {
    icon: "📈",
    title: "Progress that compounds",
    text: "Every saved session builds a visible record of improvement you can track over time.",
  },
];

const outcomes = [
  { value: "5", label: "Questions per session", sub: "Tailored to your role" },
  { value: "360°", label: "Feedback coverage", sub: "Answer, voice and camera" },
  { value: "8+", label: "Readiness target", sub: "Score to aim for" },
  { value: "7-day", label: "Action plan", sub: "After every session" },
];

export default function Home() {
  return (
    <MarketingShell currentPath="/">

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-7 sm:px-6 sm:pb-16 sm:pt-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div className="text-center lg:text-left">
            <div className="mx-auto mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200 shadow-xl shadow-purple-950/20 lg:mx-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </span>
              Premium interview training · Beta
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

            <div className="mt-6 grid max-w-2xl grid-cols-4 gap-2 sm:gap-3 lg:mx-0">
              {outcomes.map((item) => (
                <StatCard key={item.label} value={item.value} label={item.label} />
              ))}
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

      {/* Trust pillars */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {trustPillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl"
            >
              <span className="text-2xl">{pillar.icon}</span>
              <p className="mt-3 font-black text-white">{pillar.title}</p>
              <p className="mt-2 text-sm leading-6 text-gray-400">{pillar.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Overview cards */}
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

      {/* Social proof / testimonials */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
        <SectionHeading
          align="center"
          eyebrow="What candidates say"
          title="Trusted by candidates in real interview prep."
          description="AI Career Mentor is used by graduates, career changers and professionals preparing for interviews that matter."
        />

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <TestimonialCard
            quote="The voice delivery feedback was something I had never seen before. I didn't realise how many filler words I was using until I saw the metrics."
            name="Software engineering graduate"
            context="Preparing for Big Tech interviews"
          />
          <TestimonialCard
            quote="I used AI Career Mentor the week before my final-round interview. The structured feedback on my answers gave me real things to work on, not just vague tips."
            name="Career changer, operations to product"
            context="Final-stage panel interview"
          />
          <TestimonialCard
            quote="The tailored questions matched the actual format of my interview almost exactly. Having natural audio made the practice feel much more realistic."
            name="Experienced professional"
            context="Senior management interview"
          />
        </div>
      </section>

      {/* Why it works */}
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

            <div className="mt-6 flex gap-3">
              <Link href="/practice">
                <button className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-purple-900/30 transition hover:scale-[1.02]">
                  Start practising free
                </button>
              </Link>
              <Link href="/pricing">
                <button className="rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/[0.09]">
                  See pricing
                </button>
              </Link>
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
      <p className="text-xl font-black tracking-[-0.03em] sm:text-2xl">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-gray-400 sm:text-[11px] sm:leading-5">
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

function TestimonialCard({
  quote,
  name,
  context,
}: {
  quote: string;
  name: string;
  context: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
      <p className="text-2xl text-purple-300/60">&ldquo;</p>
      <p className="mt-2 text-sm leading-7 text-gray-300">{quote}</p>
      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-sm font-black text-white">{name}</p>
        <p className="mt-1 text-xs text-gray-500">{context}</p>
      </div>
    </div>
  );
}
