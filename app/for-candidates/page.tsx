import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";

export const metadata: Metadata = createPageMetadata({
  path: "/for-candidates",
  title: "Interview Practice & Assessment Centre Coaching for Candidates",
  description:
    "AI Career Mentor helps candidates prepare for interviews and assessment centres. Tailored questions, mock case studies, presentation practice, voice and camera analysis — all in one place.",
  keywords: [
    "interview practice",
    "assessment centre practice",
    "mock assessment centre",
    "AI interview coach",
    "graduate interview practice",
    "case study practice",
    "presentation interview practice",
  ],
});

const products = [
  {
    eyebrow: "Product 1",
    title: "Interview practice",
    description:
      "Five tailored questions for your exact role and level. Honest feedback on every answer. Voice delivery scored. Camera presence reviewed. Model answers included.",
    bullets: [
      "Tailored to your role, level and interview type",
      "Voice and camera delivery feedback",
      "Model answers and improvement steps",
      "Sessions saved across history",
    ],
    href: "/for-candidates/interview-practice",
    cta: "Explore interview practice →",
    accent: "purple",
  },
  {
    eyebrow: "Product 2 · NEW",
    title: "Mock assessment centre",
    description:
      "The only platform that runs a realistic AI assessment centre experience. Case study analysis, competency interview, presentation simulation — all scored across competencies in one structured session.",
    bullets: [
      "Case study with timed structured response",
      "5-question competency interview",
      "3-minute spoken presentation simulation",
      "Multi-axis scoring report and improvement plan",
    ],
    href: "/for-candidates/assessment-centre",
    cta: "Explore assessment centre →",
    accent: "cyan",
  },
] as const;

const trustPillars = [
  {
    title: "Built for the moments that matter",
    text: "Most candidates only get one shot at the interview that decides their career. The platform is built for that level of stake.",
  },
  {
    title: "Your data stays yours",
    text: "CV and answer data is never sold or shared with employers. Delete everything any time.",
  },
  {
    title: "Compounding improvement",
    text: "Every session builds a visible record of progress. Patterns across sessions become focus areas.",
  },
  {
    title: "Realistic delivery scoring",
    text: "Voice delivery, camera presence, eye contact and pace are all scored — not just the words you said.",
  },
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
      "I used the mock assessment centre the week before my final-round panel. Practising the case study under a timer made the real one feel routine.",
    name: "Career changer — operations to product",
    context: "Final-stage panel interview",
  },
  {
    quote:
      "The questions matched the actual format of my interview almost exactly. Hearing them spoken aloud made the practice noticeably more realistic.",
    name: "Experienced professional",
    context: "Senior management interview",
  },
];

export default function ForCandidatesPage() {
  return (
    <AudienceShell audience="candidate" currentPath="/for-candidates">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 text-center sm:px-6 sm:pb-20 sm:pt-16 lg:pt-20">
        <p className="mx-auto mb-6 inline-flex items-center gap-2.5 rounded-full border border-purple-400/25 bg-purple-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
          For candidates
        </p>

        <h1 className="mx-auto max-w-5xl text-[2.7rem] font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-[4rem] xl:text-[4.5rem]">
          Interview practice. Assessment centre prep.{" "}
          <span className="bg-gradient-to-r from-purple-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
            One platform built to get you hired.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg sm:leading-9">
          Two complete products in one. Run mock interviews tailored to your
          role, or step through a full assessment centre experience —
          case study, competency interview and presentation — all scored.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/for-candidates/sign-up">
            <button className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-8 py-4 text-base font-black text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02] sm:w-auto">
              Start free →
            </button>
          </Link>
          <Link href="/for-candidates/interview-practice">
            <button className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-base font-black text-white transition hover:bg-white/[0.08] sm:w-auto">
              How it works
            </button>
          </Link>
        </div>

        <p className="mt-5 text-xs text-gray-600">
          Free to start. No credit card required.
        </p>
      </section>

      {/* Two products */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-purple-300/90">
            What you get
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            Two products. One workflow.
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {products.map((product) => (
            <article
              key={product.title}
              className={`group relative overflow-hidden rounded-[2rem] border p-8 transition hover:-translate-y-1 sm:p-10 ${
                product.accent === "purple"
                  ? "border-purple-500/[0.18] bg-purple-500/[0.05] hover:border-purple-500/[0.28] hover:bg-purple-500/[0.08]"
                  : "border-cyan-500/[0.18] bg-cyan-500/[0.05] hover:border-cyan-500/[0.28] hover:bg-cyan-500/[0.08]"
              }`}
            >
              <div
                className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl ${
                  product.accent === "purple"
                    ? "bg-purple-500/[0.14]"
                    : "bg-cyan-500/[0.12]"
                }`}
              />
              <p
                className={`text-[11px] font-black uppercase tracking-[0.26em] ${
                  product.accent === "purple"
                    ? "text-purple-300/90"
                    : "text-cyan-300/90"
                }`}
              >
                {product.eyebrow}
              </p>
              <h3 className="mt-3 text-3xl font-black tracking-[-0.045em]">
                {product.title}
              </h3>
              <p className="mt-4 text-base leading-7 text-gray-400">
                {product.description}
              </p>
              <ul className="mt-6 space-y-2.5">
                {product.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-3 text-sm text-gray-300"
                  >
                    <span
                      className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${
                        product.accent === "purple"
                          ? "bg-purple-400"
                          : "bg-cyan-400"
                      }`}
                    />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href={product.href}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-black text-white transition hover:scale-[1.01] ${
                    product.accent === "purple"
                      ? "border-purple-300/30 bg-purple-300/[0.10] hover:bg-purple-300/[0.15]"
                      : "border-cyan-300/30 bg-cyan-300/[0.10] hover:bg-cyan-300/[0.15]"
                  }`}
                >
                  {product.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Trust pillars */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {trustPillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-6 transition hover:border-white/[0.12] hover:bg-white/[0.05]"
            >
              <p className="font-black text-white">{pillar.title}</p>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {pillar.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-purple-300/90">
            Candidate feedback
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            Used by candidates preparing for interviews that matter.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] p-7"
            >
              <p className="text-3xl font-black leading-none text-purple-400/40">
                &ldquo;
              </p>
              <p className="mt-3 text-sm leading-7 text-gray-300">{t.quote}</p>
              <div className="mt-6 border-t border-white/[0.08] pt-5">
                <p className="text-sm font-black text-white">{t.name}</p>
                <p className="mt-1 text-xs text-gray-600">{t.context}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="rounded-[2rem] border border-white/[0.1] bg-gradient-to-br from-purple-500/[0.10] via-fuchsia-500/[0.06] to-transparent p-10 text-center sm:p-14">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-purple-300/90">
            Get started
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            Prepare with the same standard your interviewers will apply.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400">
            Free to start. No credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/for-candidates/sign-up">
              <button className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-8 py-4 text-base font-black text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02] sm:w-auto">
                Start free →
              </button>
            </Link>
            <Link href="/for-candidates/sign-in">
              <button className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-base font-black text-white transition hover:bg-white/[0.08] sm:w-auto">
                Already have an account
              </button>
            </Link>
          </div>
        </div>
      </section>
    </AudienceShell>
  );
}
