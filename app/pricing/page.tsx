import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";
import { CandidatePricingPlans } from "@/app/components/marketing/CandidatePricingPlans";
import { detectCurrency } from "@/app/lib/pricingCurrency";
import { FAQSection } from "@/app/components/marketing/FAQSection";
import { LaunchPromoBanner } from "@/app/components/marketing/LaunchPromoBanner";

export const metadata: Metadata = createPageMetadata({
  path: "/pricing",
  title: "Candidate Pricing",
  description:
    "One plan for AI interview practice and assessment centre coaching, from £15 a month. Every account starts with a 3-day free trial, no payment details required. Pay quarterly and save 15%, or yearly and save 33%.",
  keywords: [
    "AI interview coach pricing",
    "assessment centre pricing",
    "candidate subscription",
    "interview practice plans",
  ],
});

const faqs = [
  {
    question: "Is there a free trial?",
    answer:
      "Yes. Every new account starts with 3 days free and no payment details. You get the whole product during those days, not a cut-down version: unlimited interview practice, voice and camera modes, the mock assessment centre and the CV and Application Studio. The trial ends on its own and nothing is charged unless you choose to subscribe.",
  },
  {
    question: "What happens when the trial ends?",
    answer:
      "You keep your account, your saved interviews, your reports and the free tools. To start a new interview after the trial you subscribe to Pro.",
  },
  {
    question: "Why is there only one plan?",
    answer:
      "Splitting the product into tiers meant most people practised on a thin version of it and judged us on that. One plan is simpler to understand and means everyone gets the part that actually helps.",
  },
  {
    question: "Can I switch between monthly, quarterly and yearly?",
    answer:
      "Yes, at any time from your account. Quarterly saves 15% against paying monthly and yearly saves 33%. Switching keeps you in the currency you signed up in.",
  },
  {
    question: "Is everything included?",
    answer:
      "Yes. Unlimited practice in typed, voice and voice with camera modes, scored feedback and a model answer on every question, the full mock assessment centre (case study, interview and presentation), the CV and Application Studio, custom session length and question mix, and your progress tracked over time.",
  },
  {
    question: "Can I cancel at any time?",
    answer:
      "Yes. Cancel from your account and you keep access until the end of the period you have paid for. Quarterly and yearly plans are charged upfront. Every paid plan comes with a 7-day money-back guarantee, no questions asked.",
  },
  {
    question: "Is my data deleted when I cancel?",
    answer:
      "You stay in control of your data. You can permanently delete your saved practice sessions and profile at any time from your profile page, or email privacy@aicareermentor.co.uk to request full deletion. Cancelling on its own does not delete anything: your saved interviews and reports stay available to you.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default async function CandidatePricingPage() {
  const currency = await detectCurrency();

  return (
    <CandidateShell currentPath="/pricing">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section className="mx-auto max-w-5xl px-4 pb-12 pt-1 text-center sm:px-6 sm:pt-3">
        <h1 className="text-3xl font-bold leading-[1.04] tracking-tight sm:text-4xl">
          Three days free. Then one plan, everything included.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-9">
          No payment details to start, and no cut-down version to be
          disappointed by. Pay monthly, or save by paying quarterly or yearly.
        </p>
      </section>

      <section className="mx-auto max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] px-4 pb-16 sm:px-6 sm:pb-20">
        <LaunchPromoBanner />
        <CandidatePricingPlans currency={currency} />
      </section>

      <div className="border-t border-white/[0.06]">
        <FAQSection items={faqs} accentColor="purple" />
      </div>
    </CandidateShell>
  );
}
