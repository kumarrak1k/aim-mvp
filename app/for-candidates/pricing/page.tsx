import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { createPageMetadata } from "@/app/config/seo";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
import { CandidatePricingPlans, type PricingCurrency } from "@/app/components/marketing/CandidatePricingPlans";
import { FAQSection } from "@/app/components/marketing/FAQSection";

export const metadata: Metadata = createPageMetadata({
  path: "/for-candidates/pricing",
  title: "Candidate Pricing — AI Career Mentor",
  description:
    "Transparent candidate pricing for AI interview practice and assessment centre coaching. Free to start, then unlock unlimited sessions. Annual plans save up to 28%.",
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
    question: "Is there a free trial on paid plans?",
    answer:
      "Yes — Professional and Advanced plans start with a free trial. No credit card required to begin.",
  },
  {
    question: "Can I switch between monthly and annual billing?",
    answer:
      "Yes. You can switch at any time from your account settings. Annual billing is charged upfront and gives you up to 28% off versus monthly.",
  },
  {
    question: "What happens when I reach my session limit on the free tier?",
    answer:
      "You can continue using the platform but won't be able to start new practice sessions until the next month, or you can upgrade to Professional for unlimited sessions.",
  },
  {
    question: "Does the Professional plan include assessment centre practice?",
    answer:
      "Interview practice (competency, technical, and behavioural) is included on Professional. The full mock assessment centre — case study, interview, and presentation — is an Advanced plan feature.",
  },
  {
    question: "Can I customise how many questions I get and what types?",
    answer:
      "Yes, on the Advanced plan. You can set your session length from 3 to 10 questions and build a hybrid question mix — for example, 3 competency, 3 technical, 2 leadership and 1 motivation question in a single session. This lets you replicate the exact interview format you are preparing for. Free and Professional sessions use 5 questions of the type selected at setup.",
  },
  {
    question: "Can I cancel at any time?",
    answer:
      "Yes. Monthly plans can be cancelled at any time with no penalty. Annual plans are charged for the full year upfront — contact support if you need to discuss early cancellation.",
  },
  {
    question: "Is my data deleted when I cancel?",
    answer:
      "Your data is retained for 30 days after cancellation to allow reactivation. After 30 days, your profile and sessions are permanently deleted. You can also delete everything manually from the profile page at any time.",
  },
];

export default async function CandidatePricingPage() {
  const [{ userId }, currency] = await Promise.all([auth(), detectCurrency()]);
  const Shell = userId
    ? ({ children }: { children: React.ReactNode }) => (
        <CandidateAppShell currentPath="/for-candidates/pricing">{children}</CandidateAppShell>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <AudienceShell audience="candidate" currentPath="/for-candidates/pricing">{children}</AudienceShell>
      );

  return (
    <Shell>
      <section className="mx-auto max-w-5xl px-4 pb-12 pt-6 text-center sm:px-6 sm:pt-10">
        <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
          Candidate pricing
        </p>
        <h1 className="text-[2.4rem] font-black leading-[1.04] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
          Start free. Upgrade when the interview matters.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg sm:leading-9">
          Plans are built around how seriously you&rsquo;re preparing — from
          first-time practice to full assessment centre prep.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
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
            className="font-black text-fuchsia-300 hover:text-fuchsia-200"
          >
            business pricing →
          </Link>
        </p>
        <p className="mt-2 text-sm text-gray-500">
          University or careers service?{" "}
          <Link
            href="/universities"
            className="font-black text-cyan-300 hover:text-cyan-200"
          >
            See campus licensing →
          </Link>
        </p>
      </section>
    </Shell>
  );
}
