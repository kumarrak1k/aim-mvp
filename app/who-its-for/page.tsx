import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const audiences = [
  {
    title: "Students & Graduates",
    subtitle: "Get interview-ready for your first role",
    points: [
      "Practise common graduate interview questions",
      "Learn how to structure answers using real examples",
      "Build confidence speaking under pressure",
      "Understand what recruiters are actually looking for",
    ],
  },
  {
    title: "Early Career Professionals",
    subtitle: "Level up for your next opportunity",
    points: [
      "Improve clarity and impact in your answers",
      "Strengthen examples with better storytelling",
      "Reduce filler words and hesitation",
      "Develop stronger professional presence",
    ],
  },
  {
    title: "Career Switchers",
    subtitle: "Translate your experience effectively",
    points: [
      "Reframe your background for a new industry",
      "Practise explaining your transition clearly",
      "Build convincing, structured answers",
      "Gain confidence in unfamiliar interview scenarios",
    ],
  },
  {
    title: "High Performers",
    subtitle: "Refine delivery and stand out",
    points: [
      "Polish communication to a high standard",
      "Improve tone, pacing, and confidence",
      "Enhance camera presence for modern interviews",
      "Move from good answers to standout answers",
    ],
  },
];

export default function WhoItsForPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.12),transparent_25%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-6">
        <SiteHeader />

        {/* HERO */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">
              Who it’s for
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Built for anyone serious about improving interview performance
            </h1>

            <p className="mt-5 text-lg leading-8 text-gray-300">
              Whether you're preparing for your first role or refining your
              communication at a high level, AI Career Mentor helps you improve
              both your answers and how you deliver them.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/practice"
                className="inline-flex items-center justify-center rounded-2xl bg-purple-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-purple-500"
              >
                Start Practice
              </Link>

              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                How it works
              </Link>
            </div>
          </div>
        </section>

        {/* AUDIENCE CARDS */}
        <section className="py-14">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Designed for real use cases
            </p>

            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Different users, same goal: better performance
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {audiences.map((audience) => (
              <div
                key={audience.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <h3 className="mb-2 text-2xl font-semibold text-white">
                  {audience.title}
                </h3>

                <p className="mb-4 text-sm text-purple-300">
                  {audience.subtitle}
                </p>

                <ul className="space-y-2 text-gray-300">
                  {audience.points.map((point, index) => (
                    <li key={index}>• {point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* VALUE SECTION */}
        <section className="py-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">
                Why it works
              </p>

              <h2 className="text-3xl font-bold text-white md:text-4xl">
                Most people practise answers. You practise performance.
              </h2>

              <p className="mt-5 text-lg leading-8 text-gray-300">
                Interviews are not just about what you say. They are about how
                clearly, confidently, and effectively you communicate under
                pressure. This platform trains both.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <h3 className="mb-3 text-xl font-semibold text-white">
                  Content
                </h3>
                <p className="text-gray-300">
                  Improve structure, relevance, and strength of your answers.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <h3 className="mb-3 text-xl font-semibold text-white">
                  Voice
                </h3>
                <p className="text-gray-300">
                  Reduce hesitation, filler words, and weak delivery.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <h3 className="mb-3 text-xl font-semibold text-white">
                  Presence
                </h3>
                <p className="text-gray-300">
                  Improve eye contact, posture, and on-screen confidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-600/20 via-gray-950 to-cyan-500/10 p-8 md:p-10">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Get started
              </p>

              <h2 className="text-3xl font-bold text-white md:text-5xl">
                Start improving your interview performance today
              </h2>

              <p className="mt-5 text-lg leading-8 text-gray-300">
                Practise realistic interviews, improve your delivery, and build
                confidence before it matters most.
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