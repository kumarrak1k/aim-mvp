"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07030d] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07030d]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-2 rounded-2xl bg-purple-500/25 blur-xl" />
              <img
                src="/brand/logo.jpg"
                alt="AI Career Mentor"
                className="relative h-11 w-11 rounded-2xl border border-white/10 object-contain shadow-lg shadow-purple-950/40"
              />
            </div>

            <div>
              <p className="text-lg font-black tracking-[-0.03em]">
                AI Career Mentor
              </p>
              <p className="text-xs font-medium text-purple-100/55">
                Interview intelligence platform
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-gray-300 md:flex">
            <a href="#features" className="transition hover:text-white">
              Platform
            </a>
            <a href="#pathways" className="transition hover:text-white">
              Candidates
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="hidden rounded-full border border-white/10 bg-white/[0.055] px-5 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.1] sm:block">
                  Sign In
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <UserButton />
            </Show>

            <Link href="/practice">
              <button className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-black shadow-xl shadow-purple-950/20 transition hover:bg-purple-100">
                Start Practice
              </button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[620px] w-[920px] -translate-x-1/2 rounded-full bg-purple-700/30 blur-[140px]" />
        <div className="pointer-events-none absolute right-[-220px] top-24 h-[460px] w-[460px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute left-[-220px] top-80 h-[420px] w-[420px] rounded-full bg-fuchsia-500/15 blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 pb-14 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:pb-20 lg:pt-16">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 shadow-2xl shadow-purple-950/20 backdrop-blur-xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </span>
              <span className="text-sm font-black text-purple-50">
                AI feedback across answers, voice and camera presence
              </span>
            </div>

            <h1 className="max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.055em] md:text-6xl lg:text-7xl">
              Practise like the{" "}
              <span className="bg-gradient-to-r from-purple-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
                interview already matters.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              AI Career Mentor gives candidates a premium mock interview
              experience with realistic questions, strict hiring-bar feedback,
              voice analysis, camera scoring and stronger model answers.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/practice">
                <button className="group rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-base font-black shadow-2xl shadow-purple-900/35 transition hover:scale-[1.02]">
                  Start Interview Practice
                  <span className="ml-2 inline-block transition group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </Link>

              <a href="#features">
                <button className="rounded-2xl border border-white/12 bg-white/[0.06] px-7 py-4 text-base font-black text-white backdrop-blur-xl transition hover:bg-white/[0.1]">
                  See Platform
                </button>
              </a>
            </div>

            <div className="mt-9 grid max-w-2xl grid-cols-3 gap-3">
              <Stat value="5" label="question interview flow" />
              <Stat value="360°" label="voice + video feedback" />
              <Stat value="8+" label="model answer benchmark" />
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold text-gray-400">
              <TrustPill text="Strict hiring-bar scoring" />
              <TrustPill text="Readable transcript cleanup" />
              <TrustPill text="Filler-word detection" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-purple-500/30 via-fuchsia-500/15 to-cyan-400/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.075] p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/brand/logo.jpg"
                    alt="AI Career Mentor"
                    className="h-12 w-12 rounded-2xl border border-white/10 object-contain"
                  />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-100/60">
                      Live readiness report
                    </p>
                    <h2 className="mt-1 text-xl font-black">
                      Candidate Performance
                    </h2>
                  </div>
                </div>

                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/12 px-3 py-1 text-xs font-black text-emerald-200">
                  Improving
                </span>
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-black/45 p-5">
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="mb-1 text-sm font-semibold text-gray-400">
                      Overall readiness
                    </p>
                    <div className="flex items-end gap-2">
                      <span className="text-7xl font-black tracking-[-0.075em]">
                        8.2
                      </span>
                      <span className="mb-3 text-lg font-black text-gray-500">
                        /10
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-purple-300/15 bg-purple-300/10 px-4 py-3 text-right">
                    <p className="text-xs font-semibold text-gray-400">
                      Hire signal
                    </p>
                    <p className="font-black text-purple-100">Positive</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <ScoreLine label="Answer substance" value={86} />
                  <ScoreLine label="Voice confidence" value={78} />
                  <ScoreLine label="Eye contact" value={81} />
                  <ScoreLine label="Structure" value={84} />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InsightCard
                  label="Coach insight"
                  text="Make the result more measurable and finish with a sharper impact line."
                />
                <InsightCard
                  label="Next drill"
                  text="Repeat the answer once using STAR and remove filler words."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-y border-white/10 bg-white/[0.035]"
      >
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-4">
          <FeatureMini
            title="AI answer scoring"
            text="Content, clarity, relevance, confidence and structure."
          />
          <FeatureMini
            title="Voice intelligence"
            text="Pace, filler words, pauses, energy and fluency."
          />
          <FeatureMini
            title="Camera presence"
            text="Eye contact, position, posture and engagement scoring."
          />
          <FeatureMini
            title="Model answers"
            text="See what a stronger 8+/10 answer could sound like."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-purple-300">
              Why candidates pay attention
            </p>
            <h2 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">
              Interviews are performance moments. We coach the full signal.
            </h2>
            <p className="mt-5 max-w-xl leading-8 text-gray-400">
              Most tools only judge what you type. AI Career Mentor helps
              candidates understand how they actually come across: what they say,
              how clearly they say it, and whether their delivery builds trust.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FeatureCard
              title="Strict hiring-bar feedback"
              desc="Every answer is judged against what a real interviewer would expect, not vague encouragement."
            />
            <FeatureCard
              title="Elite delivery coaching"
              desc="Voice and camera analysis help users understand pace, presence, confidence and clarity."
            />
            <FeatureCard
              title="Readable transcripts"
              desc="Speech is cleaned for evaluation while preserving filler words and what the candidate actually said."
            />
            <FeatureCard
              title="Actionable next steps"
              desc="Users finish with a final score, hire signal, strengths, weaknesses and targeted practice actions."
            />
          </div>
        </div>
      </section>

      <section id="pathways" className="relative bg-[#0c0615] px-6 py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_45%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                Who it helps
              </p>
              <h2 className="max-w-2xl text-3xl font-black tracking-[-0.04em] md:text-5xl">
                Built for high-stakes career moments.
              </h2>
            </div>

            <Link href="/practice">
              <button className="rounded-2xl bg-white px-6 py-3 font-black text-black shadow-xl shadow-black/20 transition hover:bg-purple-100">
                Try it now
              </button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <PathwayCard
              title="Graduates"
              text="Prepare for placements, internships, assessment centres and first professional roles."
            />
            <PathwayCard
              title="Career changers"
              text="Turn transferable experience into confident, structured interview stories."
            />
            <PathwayCard
              title="Professionals"
              text="Sharpen communication, executive presence and evidence-led answers."
            />
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-purple-300">
            Pricing
          </p>
          <h2 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">
            Start practising before the interview does.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-400">
            Simple plans for candidates who want sharper answers, stronger
            confidence and better interview performance.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          <PricingCard
            name="Starter"
            price="Free"
            text="Try the core interview practice experience."
            features={["AI questions", "Basic feedback", "Model answer preview"]}
          />

          <PricingCard
            highlight
            name="Coach"
            price="£9"
            text="For serious candidates preparing for upcoming interviews."
            features={[
              "Voice scoring",
              "Video scoring",
              "Full answer reports",
              "Session history",
            ]}
          />

          <PricingCard
            name="Pro"
            price="£19"
            text="For high-stakes interviews and deeper preparation."
            features={[
              "Advanced reports",
              "Pathway plans",
              "Mock interview library",
            ]}
          />
        </div>
      </section>

      <section className="px-6 pb-16 lg:pb-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-r from-purple-600/25 via-fuchsia-500/15 to-blue-600/20 p-8 text-center shadow-2xl shadow-purple-950/30 md:p-12">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          <h2 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">
            Stop guessing. Start improving.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-8 text-gray-300">
            Practise once and immediately see what to fix before your next real
            interview.
          </p>

          <Link href="/practice">
            <button className="mt-7 rounded-2xl bg-white px-8 py-4 font-black text-black shadow-xl shadow-black/20 transition hover:bg-purple-100">
              Launch Interview Coach
            </button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
          <div className="flex items-center gap-3">
            <img
              src="/brand/logo.jpg"
              alt="AI Career Mentor"
              className="h-10 w-10 rounded-xl border border-white/10 object-contain"
            />
            <div>
              <p className="font-black">AI Career Mentor</p>
              <p className="text-xs text-gray-500">
                Interview intelligence platform
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-5 text-sm font-semibold text-gray-400">
            <a href="#features" className="hover:text-white">
              Platform
            </a>
            <a href="#pathways" className="hover:text-white">
              Candidates
            </a>
            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>
            <Link href="/practice" className="hover:text-white">
              Practice
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-xl shadow-black/10 backdrop-blur-xl">
      <p className="text-2xl font-black tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-gray-400">{label}</p>
    </div>
  );
}

function TrustPill({ text }: { text: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2">
      ✓ {text}
    </div>
  );
}

function ScoreLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-medium text-gray-300">{label}</span>
        <span className="font-black text-white">{value}%</span>
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
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-purple-200/70">
        {label}
      </p>
      <p className="text-sm leading-6 text-gray-300">{text}</p>
    </div>
  );
}

function FeatureMini({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/0 p-2 transition hover:border-white/10 hover:bg-white/[0.035]">
      <p className="font-black text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-gray-400">{text}</p>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="group rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:bg-white/[0.065]">
      <div className="mb-4 h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-400/30 to-cyan-300/20 ring-1 ring-white/10" />
      <h3 className="mb-2 text-xl font-black tracking-[-0.02em]">{title}</h3>
      <p className="leading-7 text-gray-400">{desc}</p>
    </div>
  );
}

function PathwayCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-6 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:bg-black/45">
      <h3 className="mb-2 text-2xl font-black tracking-[-0.03em]">{title}</h3>
      <p className="leading-7 text-gray-400">{text}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  text,
  features,
  highlight = false,
}: {
  name: string;
  price: string;
  text: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative rounded-[1.75rem] border p-6 shadow-2xl ${
        highlight
          ? "border-purple-300/50 bg-purple-400/12 shadow-purple-950/30"
          : "border-white/10 bg-white/[0.04] shadow-black/10"
      }`}
    >
      {highlight && (
        <>
          <div className="absolute -inset-px rounded-[1.75rem] bg-gradient-to-b from-purple-300/25 to-transparent opacity-70" />
          <p className="relative mb-4 inline-flex rounded-full bg-purple-200 px-3 py-1 text-xs font-black text-black">
            Most popular
          </p>
        </>
      )}

      <div className="relative">
        <h3 className="text-2xl font-black tracking-[-0.03em]">{name}</h3>
        <p className="mt-2 min-h-14 leading-7 text-gray-400">{text}</p>

        <div className="my-5 flex items-end gap-1">
          <span className="text-4xl font-black tracking-[-0.04em]">
            {price}
          </span>
          {price !== "Free" && <span className="mb-1 text-gray-400">/mo</span>}
        </div>

        <div className="space-y-3 text-sm font-medium text-gray-300">
          {features.map((feature) => (
            <p key={feature}>✓ {feature}</p>
          ))}
        </div>
      </div>
    </div>
  );
}