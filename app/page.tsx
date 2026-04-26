"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#08040f] text-white">
      <header className="border-b border-white/10 bg-[#08040f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/brand/logo.jpg"
              alt="AI Career Mentor"
              className="h-11 w-11 rounded-xl object-contain"
            />
            <div>
              <p className="text-lg font-black tracking-tight">
                AI Career Mentor
              </p>
              <p className="text-xs text-purple-200/60">
                Interview coaching platform
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-300 md:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#pathways" className="hover:text-white">
              Who it helps
            </a>
            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-black text-white hover:bg-white/[0.1]">
                  Sign In
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <UserButton />
            </Show>

            <Link href="/practice">
              <button className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-black hover:bg-purple-100">
                Start Practice
              </button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-[-180px] h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-purple-700/30 blur-[120px]" />
        <div className="absolute right-[-180px] top-28 h-[360px] w-[360px] rounded-full bg-blue-600/20 blur-[100px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-purple-400/10 px-4 py-2 text-sm font-bold text-purple-100">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Voice + video + AI feedback for interview practice
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.045em] md:text-6xl">
              Get interview-ready with{" "}
              <span className="bg-gradient-to-r from-purple-200 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent">
                AI coaching that scores your answers and delivery.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              Practise realistic interview questions, receive detailed feedback,
              and improve your content, confidence, pace, eye contact and body
              language before the real interview.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/practice">
                <button className="rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 px-7 py-4 text-base font-black shadow-xl shadow-purple-900/30 transition hover:scale-[1.02]">
                  Start Interview Practice
                </button>
              </Link>

              <a href="#pricing">
                <button className="rounded-2xl border border-white/15 bg-white/[0.06] px-7 py-4 text-base font-bold text-white hover:bg-white/[0.1]">
                  View Pricing
                </button>
              </a>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <Stat value="5" label="Question mock interview" />
              <Stat value="360°" label="Voice + video scoring" />
              <Stat value="8+" label="Model answer target" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-purple-500/30 to-cyan-500/20 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-200/70">
                    Live report
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    Candidate Readiness
                  </h2>
                </div>
                <span className="rounded-full bg-green-400/15 px-3 py-1 text-xs font-black text-green-300">
                  Improving
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/45 p-5">
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <p className="mb-1 text-sm text-gray-400">Overall score</p>
                    <div className="flex items-end gap-2">
                      <span className="text-6xl font-black tracking-[-0.06em]">
                        8.2
                      </span>
                      <span className="mb-2 text-lg font-black text-gray-500">
                        /10
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-purple-400/10 px-4 py-3 text-right">
                    <p className="text-xs text-gray-400">Hire signal</p>
                    <p className="font-black text-purple-200">Positive</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <ScoreLine label="Content" value={86} />
                  <ScoreLine label="Voice confidence" value={78} />
                  <ScoreLine label="Eye contact" value={81} />
                  <ScoreLine label="Structure" value={84} />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-4">
                <p className="mb-1 text-sm font-black text-purple-200">
                  AI Coach Insight
                </p>
                <p className="text-sm leading-6 text-gray-300">
                  “Your answer is relevant, but make the result more measurable
                  and finish with a stronger impact line.”
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-white/10 bg-white/[0.035]">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-4">
          <FeatureMini title="AI answer scoring" text="Content, clarity, relevance and structure." />
          <FeatureMini title="Voice analysis" text="Pace, filler words, pauses and confidence." />
          <FeatureMini title="Video analysis" text="Eye contact, position and engagement." />
          <FeatureMini title="Model answers" text="See what an 8+/10 answer sounds like." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-purple-300">
              Why it works
            </p>
            <h2 className="text-3xl font-black tracking-[-0.035em] md:text-5xl">
              Most candidates practise answers. We coach the full performance.
            </h2>
            <p className="mt-5 leading-8 text-gray-400">
              Interviews are not only about what you say. They are about clarity,
              confidence, structure, pace and presence. AI Career Mentor brings
              those signals into one focused practice experience.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FeatureCard
              title="Detailed section feedback"
              desc="Every answer gets feedback across content, clarity, relevance, structure, confidence and pace."
            />
            <FeatureCard
              title="Delivery coaching"
              desc="Voice and camera signals help users understand how they are coming across."
            />
            <FeatureCard
              title="Stronger model answers"
              desc="Users see a realistic high-scoring answer they can learn from immediately."
            />
            <FeatureCard
              title="Interview summary"
              desc="At the end, users get a final score, hire signal, strengths and next steps."
            />
          </div>
        </div>
      </section>

      <section id="pathways" className="bg-[#0d0719] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                Who it helps
              </p>
              <h2 className="max-w-2xl text-3xl font-black tracking-[-0.035em] md:text-5xl">
                Built for high-stakes career moments.
              </h2>
            </div>
            <Link href="/practice">
              <button className="rounded-2xl bg-white px-6 py-3 font-black text-black hover:bg-purple-100">
                Try it now
              </button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <PathwayCard
              title="Graduates"
              text="Prepare for placements, internships and first professional roles."
            />
            <PathwayCard
              title="Career changers"
              text="Turn transferable experience into focused interview stories."
            />
            <PathwayCard
              title="Professionals"
              text="Sharpen confidence, communication and executive presence."
            />
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-purple-300">
            Pricing
          </p>
          <h2 className="text-3xl font-black tracking-[-0.035em] md:text-5xl">
            Start practising today.
          </h2>
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
            text="For serious candidates preparing for interviews."
            features={["Voice scoring", "Video scoring", "Full reports", "Session history"]}
          />
          <PricingCard
            name="Pro"
            price="£19"
            text="For high-stakes interviews and deeper preparation."
            features={["Advanced reports", "Pathway plans", "Mock interview library"]}
          />
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-gradient-to-r from-purple-600/25 to-blue-600/20 p-8 text-center shadow-2xl shadow-purple-950/30 md:p-12">
          <h2 className="text-3xl font-black tracking-[-0.035em] md:text-5xl">
            Stop guessing. Start improving.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-gray-300">
            Practise once and immediately see what to fix before your next real
            interview.
          </p>
          <Link href="/practice">
            <button className="mt-7 rounded-2xl bg-white px-8 py-4 font-black text-black hover:bg-purple-100">
              Launch Interview Coach
            </button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <img
              src="/brand/logo.jpg"
              alt="AI Career Mentor"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <p className="font-black">AI Career Mentor</p>
          </div>

          <div className="flex gap-5 text-sm text-gray-400">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#pathways" className="hover:text-white">
              Who it helps
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs leading-5 text-gray-400">{label}</p>
    </div>
  );
}

function ScoreLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="font-black">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-400 to-cyan-300"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function FeatureMini({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="font-black text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-gray-400">{text}</p>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-6">
      <h3 className="mb-2 text-xl font-black">{title}</h3>
      <p className="leading-7 text-gray-400">{desc}</p>
    </div>
  );
}

function PathwayCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <h3 className="mb-2 text-2xl font-black">{title}</h3>
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
      className={`rounded-2xl border p-6 ${
        highlight
          ? "border-purple-300/50 bg-purple-400/12 shadow-xl shadow-purple-950/30"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      {highlight && (
        <p className="mb-4 inline-flex rounded-full bg-purple-300 px-3 py-1 text-xs font-black text-black">
          Most popular
        </p>
      )}

      <h3 className="text-2xl font-black">{name}</h3>
      <p className="mt-2 min-h-14 leading-7 text-gray-400">{text}</p>

      <div className="my-5 flex items-end gap-1">
        <span className="text-4xl font-black">{price}</span>
        {price !== "Free" && <span className="mb-1 text-gray-400">/mo</span>}
      </div>

      <div className="space-y-3 text-sm text-gray-300">
        {features.map((feature) => (
          <p key={feature}>✓ {feature}</p>
        ))}
      </div>
    </div>
  );
}