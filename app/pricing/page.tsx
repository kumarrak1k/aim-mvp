import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { createPageMetadata } from "@/app/config/seo";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";
import { CandidatePricingPlans, type PricingCurrency } from "@/app/components/marketing/CandidatePricingPlans";
import { FAQSection } from "@/app/components/marketing/FAQSection";
import { LaunchPromoBanner } from "@/app/components/marketing/LaunchPromoBanner";

export const metadata: Metadata = createPageMetadata({
  path: "/pricing",
  title: "Candidate Pricing",
  description:
    "Transparent candidate pricing for AI interview practice and assessment centre coaching. Every account starts with a 3-day free trial, no payment details required. Annual plans save up to 28%.",
  keywords: [
    "AI interview coach pricing",
    "assessment centre pricing",
    "candidate subscription",
    "interview practice plans",
  ],
});

const EU_EUR = new Set([
  "AT","BE","CY","EE","FI","FR","DE","GR","IE","IT","LV","LT","LU","MT",
  "NL","PT","SK","SI","ES","BG","HR","CZ","DK","HU","PL","RO","SE",
]);

async function detectCurrency(): Promise<PricingCurrency> {
  const h = await headers();
  const country = h.get("x-vercel-ip-country") ?? "GB";
  if (country === "US" || country === "CA") return "USD";
  if (EU_EUR.has(country)) return "EUR";
  return "GBP";
}

const faqs = [
  {
    question: "Is there a free trial?",
    answer:
      "Yes. Every new account starts with a 3-day free trial: unlimited practice with voice and camera coaching, no payment details required. (Mock assessment centres and career documents are on the Professional plan.) When the trial ends you move to the Free plan automatically (no charge), and you can upgrade any time.",
  },
  {
    question: "Can I switch between monthly and annual billing?",
    answer:
      "Yes. You can switch at any time from your account settings. Annual billing is charged upfront and gives you up to 28% off versus monthly.",
  },
  {
    question: "What happens when my trial ends, or I reach the free limit?",
    answer:
      "After your 3-day trial you move to the Free plan, which includes 3 keyboard-only practice sessions. Once those are used you can upgrade to Plus for unlimited practice with voice and camera, or Professional to add mock assessment centres.",
  },
  {
    question: "Does the Professional plan include assessment centre practice?",
    answer:
      "Interview practice (competency, technical, and behavioural) is included on Plus. The full mock assessment centre (case study, interview, and presentation) is a Professional plan feature.",
  },
  {
    question: "Can I customise how many questions I get and what types?",
    answer:
      "Yes, on the Professional plan. You can set your session length from 3 to 10 questions and build a hybrid question mix: for example, 3 competency, 3 technical, 2 leadership and 1 motivation question in a single session. This lets you replicate the exact interview format you are preparing for. Free and Plus sessions use 5 questions of the type selected at setup.",
  },
  {
    question: "Can I cancel at any time?",
    answer:
      "Yes. Monthly plans can be cancelled at any time with no penalty. Annual plans are charged for the full year upfront. Contact support if you need to discuss early cancellation. Every paid plan also comes with a 7-day money-back guarantee, no questions asked.",
  },
  {
    question: "Is my data deleted when I cancel?",
    answer:
      "You stay in control of your data. You can permanently delete your saved practice sessions and profile at any time from your profile page, or email privacy@aicareermentor.co.uk to request full deletion. If you cancel a paid plan you move to the Free plan and keep access to your saved data unless you delete it.",
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
      <section className="mx-auto max-w-5xl px-4 pb-12 pt-2 text-center sm:px-6 sm:pt-5">
        <h1 className="text-3xl font-bold leading-[1.04] tracking-tight sm:text-4xl">
          Start free. Upgrade when the interview matters.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-9">
          Plans are built around how seriously you&rsquo;re preparing, from
          first-time practice to full assessment centre prep.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <LaunchPromoBanner />
        <CandidatePricingPlans currency={currency} />
      </section>

      <div className="border-t border-white/[0.06]">
        <FAQSection items={faqs} accentColor="purple" />
      </div>

      <section className="mx-auto max-w-3xl px-4 pb-20 text-center sm:px-6 sm:pb-28">
        <p className="text-sm leading-6 text-gray-500">
          Looking for the hiring-team plan? See{" "}
          <Link
            href="/for-business/pricing"
            className="font-bold text-fuchsia-300 hover:text-fuchsia-200"
          >
            business pricing →
          </Link>
        </p>
        <p className="mt-2 text-sm text-gray-500">
          University or careers service?{" "}
          <Link
            href="/universities"
            className="font-bold text-cyan-300 hover:text-cyan-200"
          >
            See campus licensing →
          </Link>
        </p>
      </section>
    </CandidateShell>
  );
}
