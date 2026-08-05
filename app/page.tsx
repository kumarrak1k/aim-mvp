import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";
import { DemoShowcase } from "@/app/components/marketing/DemoShowcase";

export const metadata: Metadata = createPageMetadata({
  path: "/",
  title: "AI Interview Practice & Mock Assessment Centres | AI Career Mentor",
  description:
    "AI Career Mentor helps candidates prepare for interviews and assessment centres. Tailored questions, mock case studies, presentation practice, voice and camera analysis, all in one place.",
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
      "Tailored questions for your exact role and level: 5 by default, up to 10 on Professional. Honest feedback on every answer. Voice delivery scored. Camera presence reviewed. Model answers included.",
    bullets: [
      "Tailored to your role, level and interview type",
      "Custom session: 3–10 questions in your own type mix (Professional)",
      "Voice and camera delivery feedback",
      "Model answers and improvement steps",
    ],
    href: "/interview-practice",
    cta: "Explore interview practice →",
    accent: "purple",
  },
  {
    eyebrow: "Product 2 · NEW",
    title: "Mock assessment centre",
    description:
      "The only platform that runs a realistic AI assessment centre experience. Case study analysis, competency interview, presentation simulation, all scored across competencies in one structured session.",
    bullets: [
      "Case study with timed structured response",
      "5-question competency interview",
      "3-minute spoken presentation simulation",
      "Multi-axis scoring report and improvement plan",
    ],
    href: "/mock-assessment-centre",
    cta: "Explore assessment centre →",
    accent: "cyan",
  },
] as const;

const faqs = [
  {
    q: "Is AI Career Mentor free?",
    a: "Free to start, no payment details required. You can run a complete interview session and receive feedback at no cost. Unlimited sessions with voice and camera are on Plus (from £19/month); mock assessment centres and career documents are on Professional (£29/month).",
  },
  {
    q: "What interview types does it cover?",
    a: "Competency, behavioural, technical, presentation, case study, strength-based, and situational interviews, all tailored to your specific role and level. You select the format at the start of every session.",
  },
  {
    q: "Does AI Career Mentor record my video?",
    a: "Your camera feed is processed to score eye contact, facial expression and camera presence. Video is not stored, shared, or used for any purpose outside your session. You can run sessions without your camera at any time.",
  },
  {
    q: "How is this different from practising with a friend?",
    a: "AI Career Mentor scores every answer on six dimensions (content, clarity, relevance, structure, confidence and pace), then layers voice-delivery and camera-presence analysis on top. A friend can offer encouragement; the platform gives you specific, actionable feedback every time.",
  },
  {
    q: "Can I choose how many questions I get and what types?",
    a: "Yes, on the Professional plan. You can set your session length anywhere from 3 to 10 questions and build a custom type mix: for example 3 competency, 3 technical, 2 leadership and 1 motivation question. On Free and Plus plans, sessions use 5 questions of the type you select at setup.",
  },
  {
    q: "What roles and levels does it support?",
    a: "Any role, any level, from graduate and entry-level to director and executive. You enter your exact job title and seniority, and the AI generates questions matched to the competencies and difficulty expected for that level.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. Every new account starts with a 3-day free trial of the Plus plan, with no payment details required. When it ends you move to the Free plan automatically, and every paid plan comes with a 7-day money-back guarantee.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default async function ForCandidatesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <CandidateShell currentPath="/">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-1 text-center sm:px-6 sm:pb-20 sm:pt-3">
        <h1 className="text-3xl font-bold leading-[1.04] tracking-tight sm:text-4xl lg:text-5xl">
          Interview practice. Assessment centre prep.{" "}
          <span className="text-violet-300">
            One platform built to get you hired.
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg sm:leading-9">
          Two complete products in one. Run mock interviews tailored to your
          role, or step through a full assessment centre experience:
          case study, competency interview and presentation, all scored.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/for-candidates/sign-up"
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-center text-base font-bold text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02] sm:w-auto"
          >
            Start free →
          </Link>
          <Link
            href="/interview-practice"
            className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-center text-base font-bold text-white transition hover:bg-white/[0.08] sm:w-auto"
          >
            How it works
          </Link>
        </div>

        <p className="mt-5 text-xs text-gray-600">
          Free to start. No credit card required.
        </p>
      </section>

      {/* Two products */}
      <section className="mx-auto max-w-7xl 2xl:max-w-[96rem] px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-bold tracking-wide text-purple-300/90">
            What you get
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
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
                className={`text-[11px] font-bold tracking-wide ${
                  product.accent === "purple"
                    ? "text-purple-300/90"
                    : "text-cyan-300/90"
                }`}
              >
                {product.eyebrow}
              </p>
              <h3 className="mt-3 text-3xl font-bold tracking-tight">
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
                  className={`inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-bold text-white transition hover:scale-[1.01] ${
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

      {/* See it in action */}
      <DemoShowcase
        eyebrow="See it in action"
        title="The actual product, not a mockup."
        subtitle="This is exactly what you'll use: tailored questions, scored feedback on every answer, and a readiness verdict that improves with every session."
        shots={[
          {
            src: "/marketing/candidate-03-feedback.webp",
            alt: "AI feedback scoring an interview answer on content, clarity, structure and confidence",
            caption: "Every answer is scored, with a stronger model answer to learn from.",
          },
          {
            src: "/marketing/candidate-01-setup.webp",
            alt: "Tailored mock-interview setup screen",
            caption: "Build a mock interview tailored to your exact role, level and focus.",
          },
          {
            src: "/marketing/candidate-04-summary.webp",
            alt: "End-of-session readiness report with an overall score and hire signal",
            caption: "A readiness verdict and hire signal at the end of every session.",
          },
          {
            src: "/marketing/candidate-05-progress.webp",
            alt: "Progress dashboard showing an improving score trend across sessions",
            caption: "Every session is saved, so you can see yourself improve.",
          },
        ]}
      />

      {/* FAQs */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 sm:pb-20">
        <h2 className="mb-8 text-2xl font-bold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-white/[0.07]">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-bold text-white">
                {faq.q}
                <span className="mt-0.5 shrink-0 text-gray-500 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-gray-400">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl 2xl:max-w-[96rem] px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="rounded-[2rem] border border-white/[0.1] bg-gradient-to-br from-purple-500/[0.10] via-violet-500/[0.06] to-transparent p-10 text-center sm:p-14">
          <p className="text-[11px] font-bold tracking-wide text-purple-300/90">
            Get started
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Prepare with the same standard your interviewers will apply.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400">
            Free to start. No credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/for-candidates/sign-up">
              <button className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02] sm:w-auto">
                Start free →
              </button>
            </Link>
            <Link href="/for-candidates/sign-in">
              <button className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-base font-bold text-white transition hover:bg-white/[0.08] sm:w-auto">
                Already have an account
              </button>
            </Link>
          </div>
        </div>
      </section>
      </CandidateShell>
    </>
  );
}
