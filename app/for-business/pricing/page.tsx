import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { createPageMetadata } from "@/app/config/seo";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { BusinessPricingPlans, type PricingCurrency } from "@/app/components/marketing/BusinessPricingPlans";
import { FAQSection } from "@/app/components/marketing/FAQSection";

export const metadata: Metadata = createPageMetadata({
  path: "/for-business/pricing",
  title: "Hiring Team Pricing | AI Career Mentor for Business",
  description:
    "Pricing for the AI assessment platform. Per-seat plans for small teams, custom enterprise pricing for high-volume hiring. Start the Team plan with a 14-day free trial, no payment details required. Annual plans save up to 33%.",
  keywords: [
    "AI assessment platform pricing",
    "talent assessment pricing",
    "recruiter platform pricing",
    "enterprise hiring software pricing",
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
      "Yes. The Team plan includes a 14-day free trial with no payment details required, giving you 10 candidate invites to evaluate the platform with real candidates. Business and Enterprise include a structured pilot before commitment. All plans are pay-as-you-subscribe with no lock-in, cancel any time.",
  },
  {
    question: "What counts as a candidate invite?",
    answer:
      "Each unique candidate link sent counts as one invite, regardless of whether the candidate completes the assessment. Unused invites do not roll over.",
  },
  {
    question: "Can we add more recruiter seats mid-subscription?",
    answer:
      "Yes. Additional seats can be added at any time and are billed pro-rata for the remainder of the billing period.",
  },
  {
    question: "What is included in custom branding?",
    answer:
      "On the Business plan, you can upload your company logo and set a primary brand colour. Candidate-facing assessment pages and invite emails reflect your branding.",
  },
  {
    question: "Do you provide a Data Processing Agreement (DPA)?",
    answer:
      "Yes. A DPA is provided to Business and Enterprise customers as standard. Enterprise customers also get a dedicated security review and procurement documentation pack.",
  },
  {
    question: "Can we integrate with our ATS?",
    answer:
      "Direct ATS integration (Greenhouse, Lever, Workday) is on our roadmap for Enterprise customers. In the interim, candidate results can be exported from the dashboard. Contact us to discuss your requirements.",
  },
];

export default async function BusinessPricingPage() {
  const currency = await detectCurrency();

  return (
    <AudienceShell audience="business" currentPath="/for-business/pricing">
      <section className="mx-auto max-w-4xl px-4 pb-12 pt-6 text-center sm:px-6 sm:pt-10">
        <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
          Hiring team pricing
        </p>
        <h1 className="text-[2.5rem] font-black leading-[1.04] tracking-[-0.05em] sm:text-5xl">
          Pricing that scales with your hiring volume.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-9">
          Per-seat plans for small teams, custom pricing for enterprise.
          Subscribe monthly or save up to 33% annually.
        </p>
        <Link
          href="/for-business/sign-up"
          className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-purple-900/40 transition hover:scale-[1.02]"
        >
          <span aria-hidden>✨</span>
          Try the Team plan free for 14 days: no payment details, 10 candidate invites
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <BusinessPricingPlans currency={currency} />
      </section>

      <div className="border-t border-white/[0.06]">
        <FAQSection items={faqs} accentColor="purple" />
      </div>

      <section className="mx-auto max-w-3xl px-4 pb-20 text-center sm:px-6 sm:pb-28">
        <p className="text-sm leading-6 text-gray-500">
          Looking for the candidate plan? See{" "}
          <Link
            href="/pricing"
            className="font-black text-purple-300 hover:text-purple-200"
          >
            candidate pricing →
          </Link>
        </p>
        <p className="mt-2 text-sm text-gray-500">
          University or large institution?{" "}
          <Link
            href="/universities"
            className="font-black text-cyan-300 hover:text-cyan-200"
          >
            See campus licensing →
          </Link>
        </p>
      </section>
    </AudienceShell>
  );
}
