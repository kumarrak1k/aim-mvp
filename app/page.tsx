"use client";

import Link from "next/link";
import {
  BulletList,
  GlassCard,
  MarketingShell,
  SectionHeading,
} from "./components/marketing/MarketingShell";

// ─── Data ─────────────────────────────────────────────────────────────────────

const heroStats = [
  { value: "5", label: "Tailored questions" },
  { value: "360°", label: "Feedback coverage" },
  { value: "8+", label: "Readiness target" },
  { value: "100%", label: "Private data" },
];

const trustPillars = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-purple-300">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Your data stays yours",
    text: "CV and answer data is never sold or shared with employers. Delete it at any time.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-cyan-300">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
    title: "Questions built for you",
    text: "Tailored to your exact role, seniority and interview type — not recycled from a generic bank.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-fuchsia-300">
        <path d="M12 2a3 3 0 0 0 0 6m0 0a3 3 0 0 0 0 6m0 0a3 3 0 0 0 0 6" /><path d="M19 5a3 3 0 0 0 0 6m0-6a3 3 0 0 1 0 6" /><path d="M5 5a3 3 0 0 1 0 6m0-6a3 3 0 0 0 0 6" />
      </svg>
    ),
    title: "360° delivery coaching",
    text: "Answer quality, speaking pace, filler words, eye contact and posture reviewed together.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-emerald-300">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "Progress that compounds",
    text: "Every session builds a visible record of improvement you can review and act on.",
  },
];

const howItWorksSteps = [
  {
    number: "01",
    title: "Configure your session",
    description:
      "Select your target role, seniority level, interview type and specific focus areas. Every question is generated for your exact situation.",
    color: "purple",
  },
  {
    number: "02",
    title: "Answer with natural realism",
    description:
      "Questions are delivered in audio so practice resembles the real experience. Respond by voice or text — your answer is transcribed immediately.",
    color: "fuchsia",
  },
  {
    number: "03",
    title: "Receive structured coaching",
    description:
      "Each answer is scored, broken down into strengths and improvements, and paired with a model answer for direct comparison.",
    color: "cyan",
  },
  {
    number: "04",
    title: "Track your readiness",
    description:
      "Sessions are saved so your trajectory is always visible. A readiness score and next-step actions close every practice round.",
    color: "emerald",
  },
];

const candidateFeatures = [
  "Tailored questions for your role, level and industry",
  "Voice delivery scoring — pace, clarity and filler words",
  "Camera presence review — eye contact and posture",
  "Structured feedback with model answers included",
  "Progress history saved across every session",
];

const teamFeatures = [
  "Custom assessment templates per role and competency",
  "Candidate invite links — no account required from candidates",
  "Structured results dashboard with completion tracking",
  "Company branding and UK GDPR / DPA compliant",
  "Recruiter team access with role-based permissions",
];

const testimonials = [
  {
    quote:
      "The voice delivery feedback was unlike anything I had encountered before. I had no idea how many filler words I was using until I saw the analysis.",
    name: "Software engineering graduate",
    context: "Preparing for Big Tech interviews",
  },
  {
    quote:
      "I used AI Career Mentor the week before a final-round panel. The structured breakdown of each answer gave me specific things to improve, not vague reassurance.",
    name: "Career changer — operations to product",
    context: "Final-stage panel interview",
  },
  {
    quote:
      "The questions matched my actual interview format almost exactly. Hearing them spoken aloud made the practice noticeably more realistic than reading from a screen.",
    name: "Experienced professional",
    context: "Senior management interview",
  },
];

const enterpriseFeatures = [
  { icon: "📋", label: "Custom assessment templates" },
  { icon: "🔗", label: "Candidate invite links" },
  { icon: "👥", label: "Recruiter team access" },
  { icon: "📊", label: "Results dashboard" },
  { icon: "🎨", label: "Company branding" },
  { icon: "🔒", label: "UK GDPR & DPA ready" },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <MarketingShell currentPath="/">

      {/* ── Hero — centred, full-width ── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 text-center sm:px-6 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">

        {/* Live badge */}
        <div className="mx-auto mb-8 inline-flex items-center gap-2.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Now live · Beta
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-5xl text-[2.7rem] font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-[4rem] xl:text-[4.5rem]">
          Interview coaching built for{" "}
          <span className="bg-gradient-to-r from-purple-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
            the candidates and teams who take it seriously.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg sm:leading-9">
          Tailored AI questions for your exact role. Structured feedback on every answer.
          Voice delivery and camera presence scored. Progress tracked across every session.
        </p>

        {/* Dual CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/practice">
            <button className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-8 py-4 text-base font-black text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02] sm:w-auto">
              Start practising free →
            </button>
          </Link>
          <Link href="/enterprise">
            <button className="w-full rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/[0.07] px-8 py-4 text-base font-black text-fuchsia-200 transition hover:bg-fuchsia-400/[0.12] sm:w-auto">
              For hiring teams
            </button>
          </Link>
        </div>

        {/* Stat strip */}
        <div className="mx-auto mt-12 grid max-w-xl grid-cols-4 gap-3">
          {heroStats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/[0.09] bg-white/[0.04] px-2 py-3 text-center"
            >
              <p className="text-xl font-black tracking-[-0.04em] sm:text-2xl">{s.value}</p>
              <p className="mt-1 text-[9px] leading-4 text-gray-500 sm:text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Two-path audience section ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-purple-300/90">
            Who is it for
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            Choose your path.
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">

          {/* Candidate path */}
          <div className="group relative overflow-hidden rounded-[2rem] border border-purple-500/[0.18] bg-purple-500/[0.05] p-8 transition hover:border-purple-500/[0.28] hover:bg-purple-500/[0.08] sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/[0.12] blur-3xl" />
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-purple-300/90">
              For candidates
            </p>
            <h3 className="mt-3 text-3xl font-black tracking-[-0.045em]">
              Practise with precision. Perform with confidence.
            </h3>
            <p className="mt-4 text-base leading-7 text-gray-400">
              Graduates, career changers and professionals preparing for roles where the competition is serious. Structured AI coaching that improves every session.
            </p>
            <ul className="mt-6 space-y-2.5">
              {candidateFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/practice"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.01]"
              >
                Start practising free →
              </Link>
              <Link
                href="/candidates"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.08]"
              >
                Learn more
              </Link>
            </div>
          </div>

          {/* Team path */}
          <div className="group relative overflow-hidden rounded-[2rem] border border-fuchsia-500/[0.18] bg-fuchsia-500/[0.05] p-8 transition hover:border-fuchsia-500/[0.28] hover:bg-fuchsia-500/[0.08] sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-fuchsia-500/[0.12] blur-3xl" />
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300/90">
              For talent teams
            </p>
            <h3 className="mt-3 text-3xl font-black tracking-[-0.045em]">
              Run structured AI assessments at scale.
            </h3>
            <p className="mt-4 text-base leading-7 text-gray-400">
              For recruiters and HR teams replacing or augmenting telephone screens with consistent, fair, data-rich AI assessments across any volume of candidates.
            </p>
            <ul className="mt-6 space-y-2.5">
              {teamFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/company/setup"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.01]"
              >
                Create a workspace →
              </Link>
              <Link
                href="/enterprise"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.08]"
              >
                Enterprise features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust pillars ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {trustPillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl transition hover:border-white/[0.12] hover:bg-white/[0.05]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.05]">
                {pillar.icon}
              </div>
              <p className="font-black text-white">{pillar.title}</p>
              <p className="mt-2 text-sm leading-6 text-gray-500">{pillar.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center">
          <SectionHeading
            align="center"
            eyebrow="How it works"
            title="From setup to measurable improvement in one session."
            description="A focused loop — configure, answer, receive coaching, review progress — that compounds with every practice session."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {howItWorksSteps.map((step) => (
            <div
              key={step.number}
              className={`relative overflow-hidden rounded-[1.75rem] border p-6 ${
                step.color === "purple"
                  ? "border-purple-500/[0.18] bg-purple-500/[0.05]"
                  : step.color === "fuchsia"
                  ? "border-fuchsia-500/[0.18] bg-fuchsia-500/[0.05]"
                  : step.color === "cyan"
                  ? "border-cyan-500/[0.18] bg-cyan-500/[0.05]"
                  : "border-emerald-500/[0.18] bg-emerald-500/[0.05]"
              }`}
            >
              <span
                className={`text-4xl font-black leading-none ${
                  step.color === "purple"
                    ? "text-purple-500/30"
                    : step.color === "fuchsia"
                    ? "text-fuchsia-500/30"
                    : step.color === "cyan"
                    ? "text-cyan-500/30"
                    : "text-emerald-500/30"
                }`}
              >
                {step.number}
              </span>
              <h3 className="mt-3 text-lg font-black tracking-[-0.03em]">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/how-it-works">
            <button className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.08]">
              See the full platform →
            </button>
          </Link>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <SectionHeading
          align="center"
          eyebrow="Candidate feedback"
          title="Used by candidates preparing for interviews that matter."
          description="Trusted by graduates, career changers and senior professionals across a range of roles and industries."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </div>
      </section>

      {/* ── Enterprise callout ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="overflow-hidden rounded-[2rem] border border-fuchsia-500/[0.15] bg-gradient-to-br from-fuchsia-500/[0.07] via-purple-500/[0.05] to-transparent p-8 sm:p-10 lg:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300/90">
                Enterprise &amp; talent teams
              </p>
              <h2 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                Send AI assessments to candidates at scale.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400">
                Create structured interview templates, generate candidate invite links, track completion and review results — all within one recruiter dashboard designed for consistent, fair evaluation.
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
                  <div
                    key={l}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-center"
                  >
                    <p className={`text-3xl font-black ${c}`}>{n}</p>
                    <p className="mt-1 text-xs text-gray-500">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why it works ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <SectionHeading
              eyebrow="Why it works"
              title="Designed for the improvement loop that leads to better offers."
              description="Built around one principle: structured, honest practice compounds. Every session builds on the last."
            />
            <div className="mt-7">
              <BulletList
                items={[
                  "Questions tailored to your role, level and interview format.",
                  "Natural question audio makes practice feel close to the real thing.",
                  "Camera and voice delivery feedback mirrors what interviewers actually evaluate.",
                  "Saved session history makes improvement visible and trackable.",
                ]}
              />
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/practice">
                <button className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-purple-900/30 transition hover:scale-[1.02]">
                  Start practising free
                </button>
              </Link>
              <Link href="/pricing">
                <button className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/[0.08]">
                  View pricing
                </button>
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="overflow-hidden p-0">
            <img
              src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80"
              alt="Professional preparing for an interview with structured coaching"
              className="h-full min-h-[360px] w-full object-cover"
            />
          </GlassCard>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="rounded-[2rem] border border-white/[0.1] bg-gradient-to-br from-purple-500/[0.1] via-fuchsia-500/[0.07] to-transparent p-10 text-center sm:p-14">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-purple-300/90">
            Get started
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            Prepare with the same standard your interviewers will apply.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400">
            Join candidates who chose structured preparation over hoping for the best. Free to start. No credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/practice">
              <button className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-8 py-4 text-base font-black text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02] sm:w-auto">
                Start practising free →
              </button>
            </Link>
            <Link href="/how-it-works">
              <button className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-base font-black text-white transition hover:bg-white/[0.08] sm:w-auto">
                See how it works
              </button>
            </Link>
          </div>
        </div>
      </section>

    </MarketingShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
