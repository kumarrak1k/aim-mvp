import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { createPageMetadata } from "@/app/config/seo";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
import { DemoShowcase } from "@/app/components/marketing/DemoShowcase";

export const metadata: Metadata = createPageMetadata({
  path: "/for-candidates",
  title: "Interview Practice & Assessment Centre Coaching for Candidates",
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
    href: "/for-candidates/interview-practice",
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
    href: "/for-candidates/assessment-centre",
    cta: "Explore assessment centre →",
    accent: "cyan",
  },
] as const;

const howItWorks = [
  {
    number: "01",
    title: "Configure your session",
    text: "Pick role, level, interview type, difficulty and focus. Professional users can also set 3–10 questions and build a custom type mix. Or step through the full assessment-centre flow.",
    color: "purple",
  },
  {
    number: "02",
    title: "Answer with realism",
    text: "Questions play in natural audio. Answer by voice or text. Camera on if you want presence feedback. Practice that feels close to the real thing.",
    color: "fuchsia",
  },
  {
    number: "03",
    title: "Receive structured coaching",
    text: "Each answer scored, broken down with strengths and improvements, paired with a model answer for comparison.",
    color: "cyan",
  },
  {
    number: "04",
    title: "Track your readiness",
    text: "Sessions are saved. Patterns become focus areas. A readiness score and next-step actions close every session.",
    color: "emerald",
  },
];

const trustPillars = [
  {
    title: "Built for the moments that matter",
    text: "Most candidates only get one shot at the interview that decides their career. The platform is built for that level of stake.",
  },
  {
    title: "Your data stays yours",
    text: "CV and answer data is never sold. Delete everything any time.",
  },
  {
    title: "Compounding improvement",
    text: "Every session builds a visible record of progress. Patterns across sessions become focus areas.",
  },
  {
    title: "Realistic delivery scoring",
    text: "Voice delivery, camera presence, eye contact and pace are all scored, not just the words you said.",
  },
];

const readinessHighlights = [
  "Answer quality scoring",
  "Voice delivery review",
  "Camera presence feedback",
  "Saved progress history",
];

const testimonials = [
  {
    quote:
      "I wish I'd found this at the start of the process. I lost count of how many interviews and assessment centres I participated in. If I'd had this sooner, it would have helped me sharpen my skills. I found a placement in the end, and I'm sure I'll use the platform again when I graduate.",
    name: "Second-year university student",
    context: "Secured a placement role",
  },
  {
    quote:
      "I'd never taken an interview before, so I was searching for some help. I was lucky: a friend recommended this site and I gave it a try. I'd never heard of STAR, and what a simple thing to learn. It's given me the structure and confidence to handle interviews.",
    name: "Software engineer graduate",
    context: "Preparing for first interviews",
  },
  {
    quote:
      "I hadn't interviewed for over 10 years, so I needed to find a way to practise. I didn't need the assessment centre tool, so I used the Plus membership. Within three months I'd landed my new role, and there's no doubt this helped me fine-tune my CV, practise real interview questions and improve my structure.",
    name: "Experienced finance professional",
    context: "Landed a new role in 3 months",
  },
];

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
    a: "Yes. Every new account starts with a 3-day free trial of the Plus plan, with no payment details required. When it ends you move to the Free plan automatically, and every paid plan comes with a 14-day money-back guarantee.",
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
  const { userId } = await auth();

  const Shell = userId
    ? ({ children }: { children: React.ReactNode }) => (
        <CandidateAppShell currentPath="/for-candidates">{children}</CandidateAppShell>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <AudienceShell audience="candidate" currentPath="/for-candidates">{children}</AudienceShell>
      );
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Shell>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-6 text-center sm:px-6 sm:pb-20 sm:pt-10">
        <p className="mx-auto mb-5 inline-flex items-center gap-2.5 rounded-full border border-purple-400/25 bg-purple-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
          For candidates
        </p>

        <h1 className="text-[2.4rem] font-black leading-[1.04] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
          Interview practice. Assessment centre prep.{" "}
          <span className="bg-gradient-to-r from-purple-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
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
            className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-8 py-4 text-center text-base font-black text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02] sm:w-auto"
          >
            Start free →
          </Link>
          <Link
            href="/for-candidates/interview-practice"
            className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-center text-base font-black text-white transition hover:bg-white/[0.08] sm:w-auto"
          >
            How it works
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

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-purple-300/90">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            From setup to measurable improvement in one session.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-400">
            A focused loop (configure, answer, receive coaching, review
            progress) that compounds with every practice session.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {howItWorks.map((step) => (
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
              <h3 className="mt-3 text-lg font-black tracking-[-0.03em]">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                {step.text}
              </p>
            </div>
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

      {/* Why it works — twin-column with imagery */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-white/[0.09] bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-8">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.26em] text-purple-300/90">
              Why it works
            </p>
            <h2 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              Designed for the improvement loop that leads to better offers.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-400">
              Built around one principle: structured, honest practice
              compounds. Every session builds on the last.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                "Tailored questions for your role, level and interview format.",
                "Natural audio makes practice feel close to the real thing.",
                "Camera and voice delivery scoring mirrors what interviewers actually evaluate.",
                "Saved session history makes improvement visible and trackable.",
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-7 text-gray-300 sm:text-base"
                >
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {readinessHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.2rem] border border-white/[0.08] bg-black/20 p-4 text-sm font-semibold text-gray-300"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/for-candidates/sign-up">
                <button className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-purple-900/30 transition hover:scale-[1.02]">
                  Start free
                </button>
              </Link>
              <Link href="/for-candidates/pricing">
                <button className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/[0.08]">
                  See pricing
                </button>
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80"
              alt="Professional preparing for an interview with structured coaching"
              className="h-full min-h-[360px] w-full object-cover"
            />
          </div>
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

      {/* FAQs */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 sm:pb-20">
        <h2 className="mb-8 text-2xl font-black tracking-[-0.04em]">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-white/[0.07]">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-black text-white">
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
      </Shell>
    </>
  );
}
