import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const pathways = [
  {
    title: "Students & Graduates",
    description:
      "Build confidence, structure stronger answers, and practise before placements, internships, and graduate roles.",
  },
  {
    title: "Early Career Professionals",
    description:
      "Improve clarity, communication, and interview performance when you are trying to move into your next role.",
  },
  {
    title: "Career Switchers",
    description:
      "Learn how to explain your story, position your transferable skills, and sound more credible in interviews.",
  },
  {
    title: "High Performers",
    description:
      "Refine your delivery, presence, and polish so you can stand out in competitive interview processes.",
  },
];

const features = [
  {
    title: "Answer Quality",
    description:
      "Get feedback on structure, relevance, clarity, and the strength of your examples.",
  },
  {
    title: "Voice Delivery",
    description:
      "Measure pace, confidence, energy, hesitation, and how credible you sound.",
  },
  {
    title: "Camera Presence",
    description:
      "Improve eye contact, posture, engagement, and the way you come across on screen.",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose your role",
    description:
      "Start with a target role, profile, or interview goal so the practice feels relevant.",
  },
  {
    number: "02",
    title: "Answer realistic questions",
    description:
      "Respond naturally by text, voice, or with camera enabled for a more realistic experience.",
  },
  {
    number: "03",
    title: "Get instant coaching",
    description:
      "See strengths, weaknesses, rewritten answers, and delivery feedback after every question.",
  },
  {
    number: "04",
    title: "Improve interview readiness",
    description:
      "Finish with a summary of your overall performance and what to work on next.",
  },
];

const supportTracks = [
  {
    title: "Quick Practice",
    description:
      "Run a focused mock interview in minutes and get immediate feedback.",
    status: "Available now",
  },
  {
    title: "Delivery Coaching",
    description:
      "Improve how you sound and how you come across, not just what you say.",
    status: "Available now",
  },
  {
    title: "Role-Specific Prep",
    description:
      "Prepare for different career stages and interview types with more targeted practice.",
    status: "Expanding",
  },
];

const differentiators = [
  "Not just answer generation — real interview performance coaching",
  "Voice and camera analysis to improve delivery and presence",
  "Clear, practical feedback after every question",
  "Built for repeat practice so progress feels measurable",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.16),transparent_25%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-6">
        <SiteHeader />

        <section className="grid gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-purple-200">
              AI interview performance coaching
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl">
              Master interviews with AI that coaches your{" "}
              <span className="bg-gradient-to-r from-purple-300 via-white to-cyan-300 bg-clip-text text-transparent">
                performance
              </span>
              .
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              Practise realistic interview questions and get instant feedback on
              what you say, how you say it, and how you come across on screen.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/practice"
                className="inline-flex items-center justify-center rounded-2xl bg-purple-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-purple-500"
              >
                Start Free Interview
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                See How It Works
              </a>
            </div>

            <p className="mt-4 text-sm text-gray-400">
              Practise in minutes. Built for students, graduates, career
              switchers, and professionals preparing for their next move.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <StatCard value="5" label="question interview flow" />
              <StatCard value="3" label="layers of coaching" />
              <StatCard value="Instant" label="feedback after each answer" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-purple-500/20 via-transparent to-cyan-400/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6 shadow-2xl shadow-black/40">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    AI Career Mentor
                  </p>
                  <p className="text-xs text-gray-400">
                    Performance-focused interview coaching
                  </p>
                </div>
                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                  Live feedback
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">
                    Interview question
                  </p>
                  <p className="text-sm leading-7 text-gray-100">
                    Tell me about a time you handled pressure and still delivered
                    a strong result.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DashboardMetric
                    title="Content"
                    value="8.4/10"
                    tone="purple"
                  />
                  <DashboardMetric
                    title="Confidence"
                    value="6.8/10"
                    tone="cyan"
                  />
                  <DashboardMetric
                    title="Voice"
                    value="7.1/10"
                    tone="green"
                  />
                  <DashboardMetric
                    title="Presence"
                    value="6.5/10"
                    tone="orange"
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="mb-3 text-xs uppercase tracking-wide text-gray-400">
                    Coaching summary
                  </p>
                  <div className="space-y-3 text-sm text-gray-200">
                    <p>
                      Strong example and good structure. Slow slightly at the
                      start and speak with more energy to sound more confident.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <MiniList
                        title="Strengths"
                        items={[
                          "Clear example",
                          "Relevant experience",
                          "Strong structure",
                        ]}
                      />
                      <MiniList
                        title="Improve"
                        items={[
                          "Less hesitation",
                          "More vocal energy",
                          "Stronger eye contact",
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="mb-8 max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">
                What makes it different
              </p>
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                More than answers. We train how you perform.
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-black/30 p-6"
                >
                  <div className="mb-4 h-11 w-11 rounded-2xl bg-gradient-to-br from-purple-500/80 to-cyan-400/80" />
                  <h3 className="mb-3 text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="leading-7 text-gray-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-14">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
              How it works
            </p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              A complete interview simulation in minutes
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-300">
              Start with your target role, answer realistic questions, and get
              coaching that helps you improve answer quality, delivery, and
              presence.
            </p>
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

        <section id="who-its-for" className="py-14">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">
              Who it&apos;s for
            </p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Built for every stage of your career
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-300">
              Whether you are starting out, changing direction, or aiming higher,
              AI Career Mentor helps you practise with more structure,
              confidence, and clarity.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {pathways.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <h3 className="mb-3 text-2xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="leading-7 text-gray-300">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pathways" className="py-14">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-950/30 via-white/5 to-cyan-950/20 p-8">
            <div className="mb-10 max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Practice pathways
              </p>
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                Choose how you want to improve
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-300">
                The platform is designed to support different kinds of interview
                preparation, from quick mock interviews to deeper delivery
                coaching.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {supportTracks.map((track) => (
                <div
                  key={track.title}
                  className="rounded-2xl border border-white/10 bg-black/30 p-6"
                >
                  <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-200">
                    {track.status}
                  </div>
                  <h3 className="mb-3 text-2xl font-semibold text-white">
                    {track.title}
                  </h3>
                  <p className="leading-7 text-gray-300">{track.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">
                Why AI Career Mentor
              </p>
              <h2 className="text-3xl font-bold text-white md:text-4xl">
                Interview coaching that feels practical, not generic
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-300">
                Most tools help you generate answers. AI Career Mentor helps you
                improve how you think, communicate, and perform under interview
                pressure.
              </p>
            </div>

            <div className="space-y-4">
              {differentiators.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="text-base leading-7 text-gray-100">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-600/20 via-gray-950 to-cyan-500/10 p-8 md:p-10">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Start now
              </p>
              <h2 className="text-3xl font-bold text-white md:text-5xl">
                Start improving your interview performance today
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-300">
                Practise realistic questions, strengthen your answers, and get
                instant coaching on confidence, delivery, and on-screen presence.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/practice"
                  className="inline-flex items-center justify-center rounded-2xl bg-purple-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-purple-500"
                >
                  Start Free Interview
                </Link>

                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Learn how it works
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

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-gray-400">{label}</p>
    </div>
  );
}

function DashboardMetric({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "purple" | "cyan" | "green" | "orange";
}) {
  const toneMap = {
    purple:
      "from-purple-500/20 to-purple-300/10 text-purple-200 border-purple-400/20",
    cyan:
      "from-cyan-500/20 to-cyan-300/10 text-cyan-200 border-cyan-400/20",
    green:
      "from-green-500/20 to-green-300/10 text-green-200 border-green-400/20",
    orange:
      "from-orange-500/20 to-orange-300/10 text-orange-200 border-orange-400/20",
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-4 ${toneMap[tone]}`}
    >
      <p className="text-sm font-medium text-gray-300">{title}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <p key={item} className="text-sm text-gray-200">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}