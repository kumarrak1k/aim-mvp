import type { Metadata } from "next";
import { createPageMetadata } from "@/app/config/seo";
import { absoluteUrl } from "@/app/config/site";

export const metadata: Metadata = createPageMetadata({
  path: "/tools/star-scorer",
  title: "Free STAR Answer Scorer — Instant AI Feedback | AI Career Mentor",
  description:
    "Free AI-powered STAR answer scorer. No sign-in required. Paste your answer and get instant feedback on Situation, Task, Action, and Result.",
});

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  url: absoluteUrl("/tools/star-scorer"),
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the STAR method?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "STAR stands for Situation, Task, Action, Result. It is the most widely used competency interview framework, giving your answer a clear structure that interviewers can follow and evaluate.",
      },
    },
    {
      "@type": "Question",
      name: "Is the STAR scorer free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. No account required, no credit card, no usage limits on the free tool.",
      },
    },
    {
      "@type": "Question",
      name: "How does the scoring work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AI evaluates each of the four components separately — Situation, Task, Action, Result — scoring each out of 10 with specific improvement feedback, plus an overall score and a top improvement suggestion.",
      },
    },
    {
      "@type": "Question",
      name: "What types of answers work best?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The scorer is designed for competency interview answers — 'tell me about a time when...' questions. Write out your full answer as you would speak it, aiming for the equivalent of 2–4 minutes of spoken content.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use this to prepare for a real job interview?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Practise answering common competency questions with STAR structure, then refine your answers using the feedback before the real thing.",
      },
    },
  ],
};

export default function StarScorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
