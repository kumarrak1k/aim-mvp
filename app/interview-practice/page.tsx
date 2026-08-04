import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";

export const metadata: Metadata = createPageMetadata({
  path: "/interview-practice",
  title: "AI Interview Practice: Mock Interviews Online with Instant Feedback",
  description:
    "Practise interviews online with AI: tailored mock interview questions, answer scoring, voice delivery analysis, camera presence review and model answers. Free to start.",
  keywords: [
    "AI interview practice",
    "mock interview",
    "interview coaching",
    "voice interview feedback",
    "camera presence interview",
  ],
});

const features = [
  {
    title: "Tailored to your role",
    text: "Choose role, level and interview type. Every question is generated for your exact situation, not recycled from a generic bank.",
    badge: null,
  },
  {
    title: "Natural audio delivery",
    text: "Hear questions spoken aloud. Answer by voice or by typing. Practice that feels close to the real thing.",
    badge: null,
  },
  {
    title: "Honest, structured feedback",
    text: "Each answer is scored on content, clarity, structure, confidence and pace, then paired with a model answer for direct comparison.",
    badge: null,
  },
  {
    title: "Custom session builder",
    text: "On the Professional plan, choose between 3 and 10 questions per session and set your own question type mix: any blend of competency, technical, leadership, motivation and situational questions.",
    badge: "Professional",
  },
  {
    title: "Voice and camera presence",
    text: "Pace, filler words, eye contact, posture: all measured. The full picture an interviewer evaluates.",
    badge: null,
  },
  {
    title: "Progress tracked",
    text: "Sessions are saved. Patterns across sessions become focus areas. A readiness score closes every practice round.",
    badge: null,
  },
];

const steps = [
  {
    number: "01",
    title: "Configure",
    text: "Pick role, level, type, difficulty and focus. Professional users can also set session length (3–10 questions) and a custom question type mix. The AI builds the question set.",
  },
  {
    number: "02",
    title: "Answer",
    text: "Type or speak. Questions play in natural audio so the practice feels real.",
  },
  {
    number: "03",
    title: "Review",
    text: "Each answer scored, broken down with strengths and improvements, paired with a model answer.",
  },
  {
    number: "04",
    title: "Track",
    text: "Improvement is saved across every session. A readiness score and next steps after each round.",
  },
];

const faqs = [
  {
    q: "What interview formats does it support?",
    a: "Competency, behavioural, technical, presentation, strength-based, and situational, all selected at session setup. Questions are generated for your specific role and interview type, not taken from a generic bank.",
  },
  {
    q: "How are questions tailored to my role?",
    a: "You enter your job title, seniority level, and interview format. The AI generates questions that match the competencies, difficulty, and tone expected in interviews for that specific role.",
  },
  {
    q: "Does it score voice delivery as well as answers?",
    a: "Yes. Every session scores tone, pace, filler words (um, uh, like, you know), clarity, and energy alongside the content of your answer.",
  },
  {
    q: "What does a session look like?",
    a: "You receive tailored questions read aloud in natural audio: 5 by default, or 3–10 on the Professional plan. Answer by speaking or typing. After each answer you get structured feedback, then a full session report including model answers, scores, and a next-step action plan.",
  },
  {
    q: "Can I compare my answer to a model answer?",
    a: "Yes. A model answer is provided for every question after you submit your response, showing the structure, content, and language that would score highly.",
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

export default async function InterviewPracticePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    <CandidateShell currentPath="/interview-practice">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-14 pt-6 text-center sm:px-6 sm:pb-16 sm:pt-10">
        <h1 className="text-3xl font-bold leading-[1.04] tracking-tight sm:text-4xl">
          Practise interviews{" "}
          <span className="text-violet-300">
            until the answers come naturally.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-9">
          Tailored questions for your exact role and level. Detailed coaching on
          every answer. Voice delivery scored. Camera presence reviewed. Professional
          users can configure up to 10 questions in a custom type mix.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/for-candidates/sign-up"
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-center text-base font-bold text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02] sm:w-auto"
          >
            Start free →
          </Link>
          <Link
            href="/mock-assessment-centre"
            className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-center text-base font-bold text-white transition hover:bg-white/[0.08] sm:w-auto"
          >
            Looking for assessment centre?
          </Link>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-6 transition hover:border-white/[0.12] hover:bg-white/[0.05]"
            >
              <p className="text-3xl font-bold leading-none text-purple-500/40">
                {step.number}
              </p>
              <h3 className="mt-3 text-lg font-bold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-bold tracking-wide text-purple-300/90">
            What you get
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            A complete interview-coaching toolkit.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className={`rounded-[1.5rem] border p-6 ${
                f.badge
                  ? "border-fuchsia-400/20 bg-fuchsia-400/[0.05]"
                  : "border-white/[0.08] bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center gap-2">
                <p className="font-bold text-white">{f.title}</p>
                {f.badge && (
                  <span className="rounded-full bg-fuchsia-400/15 px-2 py-0.5 text-[9px] font-bold tracking-wide text-fuchsia-300">
                    {f.badge}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="rounded-[2rem] border border-white/[0.1] bg-gradient-to-br from-purple-500/[0.10] via-violet-500/[0.06] to-transparent p-10 text-center sm:p-14">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Stop hoping. Start preparing.
          </h2>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/for-candidates/sign-up"
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-7 py-4 text-center text-base font-bold text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02]"
            >
              Start free →
            </Link>
            <Link
              href="/pricing"
              className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-7 py-4 text-center text-base font-bold text-white transition hover:bg-white/[0.08]"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </CandidateShell>
    </>
  );
}
