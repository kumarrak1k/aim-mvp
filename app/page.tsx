import type { Metadata } from "next";
import { shotSrc } from "@/app/components/marketing/screenshotSet";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";
import { DemoShowcase } from "@/app/components/marketing/DemoShowcase";
import { DemoVideo } from "@/app/components/marketing/DemoVideo";
import { HomeCta } from "@/app/components/marketing/HomeCta";
import { HeroShot } from "@/app/components/marketing/HeroShot";

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
    eyebrow: "",
    title: "Interview practice",
    description:
      "Tailored questions for your exact role and level. Take a coaching interview with feedback after every answer, or a one-way video interview on a timer, the way employers run first rounds. Model answers included.",
    bullets: [
      "Tailored to your role, level and interview type",
      "One-way video interviews, timed like the real thing",
      "Voice and camera delivery feedback",
      "Model answers and improvement steps",
    ],
    href: "/interview-practice",
    cta: "Explore interview practice →",
    accent: "purple",
  },
  {
    eyebrow: "New",
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

const labelColour = { purple: "text-purple-300", cyan: "text-cyan-300" } as const;

const faqs = [
  {
    q: "Is AI Career Mentor free?",
    a: "Every new account starts with a 3-day free trial of the whole product, with no payment details required. After that there is one paid plan, Pro: £15 a month, £38 a quarter or £120 a year. The free tools (the STAR answer scorer, question banks and guides) stay free, and you keep your saved interviews and reports either way.",
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
    a: "Yes. You can set your session length anywhere from 3 to 10 questions and build a custom type mix: for example 3 competency, 3 technical, 2 leadership and 1 motivation question. It is included in Pro and in your free trial. If you would rather not choose, a standard session is 5 questions of the type you select at setup.",
  },
  {
    q: "What roles and levels does it support?",
    a: "Any role, any level, from graduate and entry-level to director and executive. You enter your exact job title and seniority, and the AI generates questions matched to the competencies and difficulty expected for that level.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. Every new account starts with a 3-day free trial of everything: unlimited practice in typed, voice and camera modes, the mock assessment centre, and the CV & Application Studio. No payment details are required and the trial ends on its own, with nothing to cancel. If you then subscribe to Pro, there is a 7-day money-back guarantee.",
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
      {/* Hero. Two columns on wide screens: the promise on the left, the
          product doing it on the right. It used to be centred text only, with
          the first real screenshot two screens further down, so a visitor had
          to take the product on trust before they could see it. */}
      <section className="mx-auto max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] px-4 pb-16 pt-1 sm:px-6 sm:pb-20 sm:pt-3">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
              Practise interviews and assessment centres{" "}
              <span className="text-violet-300">before they count.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-8 lg:mx-0">
              Mock interviews, one-way video interviews and full assessment
              centres, tailored to your role and scored on every answer.
            </p>

            <HomeCta notePosition="below" secondary="how-it-works" align="start" />
          </div>

          <HeroShot />
        </div>
      </section>

      {/* Two products */}
      <section className="mx-auto max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
              {product.eyebrow !== "" && (
                <p className={`mb-3 text-[12px] font-bold tracking-wide ${labelColour[product.accent]}`}>
                  {product.eyebrow}
                </p>
              )}
              <h3 className="text-3xl font-bold tracking-tight">
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

      {/* CV & Application Studio */}
      <section className="mx-auto max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] px-4 pb-16 sm:px-6 sm:pb-20">
        <article className="relative overflow-hidden rounded-[2rem] border border-fuchsia-500/[0.18] bg-fuchsia-500/[0.05] p-8 sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/[0.12] blur-3xl" />
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div>
              <p className="text-[12px] font-bold tracking-wide text-fuchsia-300">
                Included in Pro
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                CV &amp; Application Studio
              </h2>
              <p className="mt-4 text-base leading-7 text-gray-400">
                Interviews are won twice: once on paper, once in the room. The
                Studio handles the paper: three AI tools that turn your real
                experience into documents that get you shortlisted.
              </p>
              <div className="mt-7">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-300/30 bg-fuchsia-300/[0.10] px-6 py-3 text-sm font-bold text-white transition hover:scale-[1.01] hover:bg-fuchsia-300/[0.15]"
                >
                  See Pro pricing →
                </Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "CV Enhancer",
                  desc: "Your CV scored out of 10, bullets rewritten, and a full enhanced version you accept change by change.",
                },
                {
                  title: "Cover letter generator",
                  desc: "Letters tailored to the actual job description, built from your own evidence rather than templates.",
                },
                {
                  title: "Personal statement builder",
                  desc: "University, graduate scheme and MBA statements with a real narrative arc, at the word count you need.",
                },
              ].map((tool) => (
                <div
                  key={tool.title}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5"
                >
                  <p className="text-sm font-bold text-white">{tool.title}</p>
                  <p className="mt-2 text-xs leading-5 text-gray-400">{tool.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      {/* Advert. Sits after the screenshots rather than replacing them: the
          gallery explains what the product does, this is the only asset on the
          page with a person in it. Click to play, never autoplay — DemoVideo
          uses preload="none" so it costs nothing until someone asks for it. */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            See it in 25 seconds.
          </h2>
        </div>
        <DemoVideo
          src="/videos/advert-square.mp4"
          poster="/videos/advert-poster-2026-09-19.jpg"
          title="AI Career Mentor: practise like it's real"
          caption="From your application to the assessment centre, with every answer scored honestly."
          captionsSrc="/videos/advert-square.en.vtt"
          aspect="square"
        />
      </section>

      {/* See it in action */}
      <DemoShowcase
        title="The actual product, not a mockup."
        subtitle="This is exactly what you'll use: tailored questions, scored feedback on every answer, and a readiness verdict that improves with every session."
        shots={[
          {
            src: shotSrc("candidate-03-feedback"),
            alt: "AI feedback scoring an interview answer on content, clarity, structure and confidence",
            caption: "Every answer is scored, with a stronger model answer to learn from.",
          },
          {
            src: shotSrc("candidate-01-setup"),
            alt: "Tailored mock-interview setup screen",
            caption: "Build a mock interview tailored to your exact role, level and focus.",
          },
          {
            src: shotSrc("candidate-04-summary"),
            alt: "End-of-session readiness report with an overall score and hire signal",
            caption: "A readiness verdict and hire signal at the end of every session.",
          },
          {
            src: shotSrc("candidate-05-progress"),
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
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-white">
                {faq.q}
                <span className="mt-0.5 shrink-0 text-gray-400 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-gray-400">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="rounded-[2rem] border border-white/[0.1] bg-gradient-to-br from-purple-500/[0.10] via-violet-500/[0.06] to-transparent p-10 text-center sm:p-14">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Prepare with the same standard your interviewers will apply.
          </h2>
          <HomeCta notePosition="above" />
        </div>
      </section>
      </CandidateShell>
    </>
  );
}
