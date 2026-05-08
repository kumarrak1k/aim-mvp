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
    description: "Tailored questions, natural audio, transcript review and performance scoring in one focused practice flow.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    href: "/how-it-works",
    eyebrow: "How it works",
    title: "A simple improvement loop",
    description: "Move from setup, to answering, to feedback, to measurable next steps — no friction.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
  },
  {
    href: "/candidates",
    eyebrow: "Candidates",
    title: "Built for real career moments",
    description: "For graduates, career changers and professionals preparing for interviews that matter.",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    href: "/pricing",
    eyebrow: "Pricing",
    title: "Simple plans, clear value",
    description: "Choose the coaching level that fits how seriously you are preparing.",
    image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80",
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
    text: "CV and answer data is never sold or shared with employers. Delete it whenever you want.",
  },
  {
    icon: "🎯",
    title: "Questions that fit you",
    text: "Tailored to your role, level and interview type — not generic prompts.",
  },
  {
    icon: "🎙️",
    title: "360° delivery coaching",
    text: "Answer quality, pace, filler words, eye contact and body language all reviewed together.",
  },
  {
    icon: "📈",
    title: "Progress that compounds",
    text: "Every session builds a visible record of improvement you can track over time.",
  },
];

const outcomes = [
  { value: "5", label: "Questions per session", sub: "Tailored to your role" },
  { value: "360°", label: "Feedback coverage", sub: "Answer, voice & camera" },
  { value: "8+", label: "Readiness target score", sub: "What to aim for" },
  { value: "7-day", label: "Action plan", sub: "After every session" },
];

const enterpriseFeatures = [
  { icon: "📋", label: "Custom assessment templates" },
  { icon: "🔗", label: "Candidate invite links" },
  { icon: "👥", label: "Recruiter team access" },
  { icon: "📊", label: "Results dashboard" },
  { icon: "🎨", label: "Company branding" },
  { icon: "🔒", label: "UK GDPR & DPA ready" },
];

export default function Home() {
  return (
    <MarketingShell currentPath="/">

      {/* ── Hero ── */}
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="text-center lg:text-left">
            {/* Live badge */}
            <div className="mx-auto mb-6 inline-flex max-w-full items-center gap-2.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300 lg:mx-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Now live · Beta
            </div>

            <h1 className="mx-auto max-w-4xl text-[2.6rem] font-black leading-[1.03] tracking-[-0.055em] sm:text-5xl md:text-6xl lg:mx-0 lg:text-[3.5rem] xl:text-[4rem]">
              Practise until your answers feel{" "}
              <span className="bg-gradient-to-r from-purple-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
                sharper, calmer and more convincing.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-8 lg:mx-0">
              AI Career Mentor gives you real interview questions for your role, spoken feedback on your answers, and a clear record of improvement over time.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Link href="/practice">
                <button className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-8 py-4 text-base font-black text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02] sm:w-auto">
                  Start interview practice
                </button>
              </Link>
              <Link href="/how-it-works">
                <button className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-base font-black text-white transition hover:bg-white/[0.08] sm:w-auto">
                  See how it works
                </button>
              </Link>
            </div>

            {/* Stat row */}
            <div className="mt-8 grid max-w-lg grid-cols-4 gap-2 sm:gap-3 lg:mx-0">
              {outcomes.map((item) => (
                <StatCard key={item.label} value={item.value} label={item.label} sub={item.sub} />
              ))}
            </div>
          </div>

          {/* Hero card */}
          <GlassCard className="overflow-hidden p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SiteLogo href="" size="md" showText={false} />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-300/60">Interview cockpit</p>
                  <h2 className="text-lg font-black leading-tight sm:text-xl">Built for focused practice</h2>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                Ready
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.4rem] border border-white/[0.08] bg-black/25 p-5">
                <p className="text-xs font-semibold text-gray-500">Practice loop</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-[-0.08em] sm:text-6xl">5</span>
                  <span className="mb-2 text-base font-black text-gray-600">questions</span>
                </div>
                <div className="mt-5 space-y-4">
                  <ProgressLine label="Tailored questions" value={92} />
                  <ProgressLine label="Natural audio" value={86} />
                  <ProgressLine label="Transcript feedback" value={88} />
                  <ProgressLine label="Progress tracking" value={82} />
                </div>
              </div>

              <div className="hidden overflow-hidden rounded-[1.4rem] border border-white/[0.08] bg-black/20 sm:block">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
                  alt="Candidates preparing for interviews"
                  className="h-full min-h-[220px] w-full object-cover"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InsightCard label="Session experience" text="Question, transcript and camera stay focused in one guided workspace." />
              <InsightCard label="Progress product" text="Completed sessions are saved so improvement is visible over time." />
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ── Trust pillars ── */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {trustPillars.map((pillar) => (
            <div key={pillar.title} className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl transition hover:border-white/[0.12] hover:bg-white/[0.05]">
              <span className="text-2xl">{pillar.icon}</span>
              <p className="mt-4 font-black text-white">{pillar.title}</p>
              <p className="mt-2 text-sm leading-6 text-gray-500">{pillar.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Overview cards ── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <SectionHeading
          align="center"
          eyebrow="Explore"
          title="A focused route through the platform."
          description="Start practising quickly, then go deeper into profile setup, progress tracking and coaching features when you need them."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <PageLinkCard key={card.href} {...card} />
          ))}
        </div>
      </section>

      {/* ── For talent teams (B2B) ── */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] border border-fuchsia-500/[0.15] bg-gradient-to-br from-fuchsia-500/[0.07] via-purple-500/[0.05] to-transparent p-8 sm:p-10 lg:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300/90">For talent teams</p>
              <h2 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                Send AI assessments to candidates at scale.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400">
                Create custom interview templates, generate candidate invite links, track completion status and review structured results — all in one recruiter dashboard.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {enterpriseFeatures.map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <span className="text-base">{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/company/setup">
                  <button className="rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-purple-950/30 transition hover:scale-[1.02]">
                    Create company workspace →
                  </button>
                </Link>
                <Link href="/enterprise">
                  <button className="rounded-full border border-white/[0.1] bg-white/[0.04] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.08]">
                    Enterprise features
                  </button>
                </Link>
              </div>
            </div>

            <div className="hidden shrink-0 lg:block">
              <div className="grid w-64 grid-cols-2 gap-3">
                {[
                  { n: "12", l: "Templates", c: "text-fuchsia-300" },
                  { n: "94", l: "Sent", c: "text-purple-300" },
                  { n: "61", l: "Completed", c: "text-cyan-300" },
                  { n: "3", l: "Team members", c: "text-green-300" },
                ].map(({ n, l, c }) => (
                  <div key={l} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
                    <p className={`text-3xl font-black ${c}`}>{n}</p>
                    <p className="mt-1 text-xs text-gray-500">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <SectionHeading
          align="center"
          eyebrow="What candidates say"
          title="Trusted by candidates in real interview prep."
          description="Used by graduates, career changers and professionals preparing for interviews that genuinely matter."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
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

      {/* ── Why it works ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <SectionHeading
              eyebrow="Why it works"
              title="Designed to feel premium, focused and useful."
              description="Built around a simple improvement loop: practise, get feedback, review progress, repeat with sharper answers."
            />
            <div className="mt-7">
              <BulletList items={[
                "Tailored interview questions based on role, level and focus.",
                "Natural question audio with spoken-answer transcription.",
                "Camera and voice delivery signals for realistic remote interviews.",
                "Saved session history so progress is visible over time.",
              ]} />
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {readinessHighlights.map((item) => (
                <div key={item} className="rounded-[1.2rem] border border-white/[0.08] bg-black/20 p-4 text-sm font-semibold text-gray-300">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/practice">
                <button className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-purple-900/30 transition hover:scale-[1.02]">
                  Start practising free
                </button>
              </Link>
              <Link href="/pricing">
                <button className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/[0.08]">
                  See pricing
                </button>
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="overflow-hidden p-0">
            <img
              src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80"
              alt="Professional candidate using a laptop for interview preparation"
              className="h-full min-h-[360px] w-full object-cover"
            />
          </GlassCard>
        </div>
      </section>

    </MarketingShell>
  );
}

function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.04] p-3 text-center shadow-lg shadow-black/10 sm:p-4">
      <p className="text-xl font-black tracking-[-0.04em] sm:text-2xl">{value}</p>
      <p className="mt-1 text-[9px] leading-4 text-gray-400 sm:text-[10px]">{label}</p>
      {sub && <p className="mt-0.5 hidden text-[8px] text-gray-600 sm:block">{sub}</p>}
    </div>
  );
}

function ProgressLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        <span className="text-xs font-black text-gray-200">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-cyan-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function InsightCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/[0.08] bg-white/[0.03] p-4">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/80">{label}</p>
      <p className="text-xs leading-5 text-gray-400">{text}</p>
    </div>
  );
}

function TestimonialCard({ quote, name, context }: { quote: string; name: string; context: string }) {
  return (
    <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] p-7 backdrop-blur-xl">
      <p className="text-3xl font-black leading-none text-purple-400/40">&ldquo;</p>
      <p className="mt-3 text-sm leading-7 text-gray-300">{quote}</p>
      <div className="mt-6 border-t border-white/[0.08] pt-5">
        <p className="text-sm font-black text-white">{name}</p>
        <p className="mt-1 text-xs text-gray-600">{context}</p>
      </div>
    </div>
  );
}
