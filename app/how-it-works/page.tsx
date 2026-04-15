import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const steps = [
  {
    number: "01",
    title: "Choose your target role",
    description:
      "Start by entering your role, background, or career goal so the interview feels relevant to what you are preparing for.",
  },
  {
    number: "02",
    title: "Answer realistic interview questions",
    description:
      "Practise with AI-generated questions designed to feel like a real interview, rather than generic prompts.",
  },
  {
    number: "03",
    title: "Use voice and camera for deeper coaching",
    description:
      "Answer by voice and optionally enable camera analysis so the platform can assess delivery, confidence, and presence.",
  },
  {
    number: "04",
    title: "Get instant feedback after every question",
    description:
      "See structured feedback on content, clarity, relevance, confidence, voice delivery, and camera engagement.",
  },
  {
    number: "05",
    title: "Improve with rewritten answers",
    description:
      "Each answer includes practical improvement points and a stronger rewritten version to help you learn quickly.",
  },
  {
    number: "06",
    title: "Finish with a full interview summary",
    description:
      "At the end of the session, get a final view of your strengths, key development areas, and overall hire signal.",
  },
];

const pillars = [
  {
    title: "Answer Quality",
    description:
      "Improve structure, relevance, clarity, and the strength of your examples.",
  },
  {
    title: "Voice Delivery",
    description:
      "Assess pace, confidence, hesitation, filler words, and vocal energy.",
  },
  {
    title: "Camera Presence",
    description:
      "Improve eye contact, posture, on-screen engagement, and overall presence.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.12),transparent_25%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-6">
        <SiteHeader />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">
              How it works
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              A complete interview simulation with performance coaching built in
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-300">
              AI Career Mentor helps you practise interviews in a way that feels
              realistic and useful. It does not just help with what to say. It
              helps with how you say it and how you come across.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/practice"
                className="inline-flex items-center justify-center rounded-2xl bg-purple-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-purple-500"
              >
                Start Practice
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
              The process
            </p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              What happens in each interview session
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <p className="mb-4 text-sm font-semibold text-purple-300">
                  {step.number}
                </p>
                <h3 className="mb-3 text-2xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="leading-7 text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="mb-8 max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">
                Three layers of coaching
              </p>
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                Feedback that goes beyond basic interview practice
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-white/10 bg-black/30 p-6"
                >
                  <div className="mb-4 h-11 w-11 rounded-2xl bg-gradient-to-br from-purple-500/80 to-cyan-400/80" />
                  <h3 className="mb-3 text-xl font-semibold text-white">
                    {pillar.title}
                  </h3>
                  <p className="leading-7 text-gray-300">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-2xl font-semibold text-white">
                What you get after each answer
              </h3>
              <div className="space-y-3 text-gray-300">
                <p>• Overall score and category scores</p>
                <p>• Strengths and improvement points</p>
                <p>• Improved answer rewrite</p>
                <p>• Voice delivery scoring</p>
                <p>• Camera engagement scoring</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-2xl font-semibold text-white">
                What you get at the end
              </h3>
              <div className="space-y-3 text-gray-300">
                <p>• Final interview score</p>
                <p>• Hire signal</p>
                <p>• Top strengths</p>
                <p>• Top improvements</p>
                <p>• Clear next steps for practice</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-600/20 via-gray-950 to-cyan-500/10 p-8 md:p-10">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Ready to practise?
              </p>
              <h2 className="text-3xl font-bold text-white md:text-5xl">
                Start improving your interview performance today
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-300">
                Practise realistic questions, improve delivery, and build more
                confidence before your next interview.
              </p>

              <div className="mt-8">
                <Link
                  href="/practice"
                  className="inline-flex items-center justify-center rounded-2xl bg-purple-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-purple-500"
                >
                  Start Free Interview
                </Link>
              </div>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}