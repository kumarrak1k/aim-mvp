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
  "Clear strengths and improvements",
];

export default function Home() {
  return (
    <MarketingShell currentPath="/">
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14">
        <div className="mb-5 flex justify-center">
          <div className="relative max-w-3xl">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-purple-500/25 via-fuchsia-500/20 to-cyan-500/25 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/[0.08] px-5 py-4 shadow-2xl shadow-purple-950/30 backdrop-blur-2xl sm:px-7 sm:py-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

              <div className="flex flex-col items-center gap-3 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200 sm:text-xs">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  </span>
                  Premium interview training
                </div>

                <div className="space-y-1">
                  <p className="bg-gradient-to-r from-white via-purple-100 to-cyan-100 bg-clip-text text-xl font-black tracking-[-0.04em] text-transparent sm:text-2xl md:text-3xl">
                    AI interview coaching for answers, voice and camera presence
                  </p>
                  <p className="mx-auto max-w-2xl text-sm leading-6 text-gray-300 sm:text-base">
                    One premium practice experience that helps candidates sound
                    sharper, look more confident, and perform better in real
                    interviews.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-9 flex justify-center">
          <Link href="/practice">
            <button className="rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-3.5 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.02]">
              Stop wondering and start practising
            </button>
          </Link>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div className="text-center lg:text-left">
            <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl md:text-6xl lg:mx-0">
              Practise until your interview answers feel{" "}
              <span className="bg-gradient-to-r from-purple-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
                sharper, calmer and more convincing.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-gray-300 sm:text-lg lg:mx-0">
              AI Career Mentor helps you improve what interviewers actually
              notice: the quality of your answer, the way you sound, and the
              presence you bring on camera.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/practice">
                <button className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-base font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.02] sm:w-auto">
                  Start interview practice
                </button>
              </Link>

              <Link href="/platform">
                <button className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-7 py-4 text-base font-black text-white transition hover:bg-white/[0.1] sm:w-auto">
                  Explore the platform
                </button>
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3 lg:mx-0">
              <StatCard value="5" label="question interview flow" />
              <StatCard value="360°" label="answer and delivery feedback" />
              <StatCard value="8+" label="target benchmark answer quality" />
            </div>
          </div>

          <GlassCard className="overflow-hidden p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SiteLogo href="" size="md" showText={false} />

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-200/70">
                    Readiness report
                  </p>
                  <h2 className="text-lg font-black sm:text-xl">
                    Interview performance snapshot
                  </h2>
                </div>
              </div>

              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
                Candidate improving
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
                <p className="text-sm text-gray-400">Overall readiness</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-6xl font-black tracking-[-0.08em]">
                    8.2
                  </span>
                  <span className="mb-2 text-lg font-black text-gray-500">
                    /10
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <ProgressLine label="Answer quality" value={86} />
                  <ProgressLine label="Voice delivery" value={79} />
                  <ProgressLine label="Camera presence" value={82} />
                  <ProgressLine label="Structure" value={84} />
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
                  alt="Candidates preparing for interviews"
                  className="h-full min-h-[260px] w-full object-cover"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <InsightCard
                label="Coach insight"
                text="Strong answer foundation. Improve impact by ending with a more measurable result."
              />
              <InsightCard
                label="Next improvement"
                text="Repeat the answer with fewer filler words and a stronger final summary line."
              />
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeading
          align="center"
          eyebrow="Explore"
          title="A focused route through the platform."
          description="Each core section has its own dedicated page, keeping the homepage cleaner and the experience more professional."
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
              description="The platform works best when the experience feels calm, high quality and easy to trust. The interface focuses on clarity, structure and evidence-led improvement."
            />

            <div className="mt-6">
              <BulletList
                items={[
                  "Shorter homepage with clearer navigation.",
                  "Dedicated pages for Platform, How it works, Candidates and Pricing.",
                  "Consistent shared header, logo sizing and background treatment.",
                  "Premium imagery to make the brand feel stronger and more engaging.",
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-center shadow-xl shadow-black/10">
      <p className="text-2xl font-black tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-gray-400">{label}</p>
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