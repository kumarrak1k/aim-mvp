import type { Metadata } from "next";
import { createPageMetadata } from "@/app/config/seo";
import { absoluteUrl, siteConfig } from "@/app/config/site";
import { PublicShell } from "@/app/components/marketing/PublicShell";

export const metadata: Metadata = createPageMetadata({
  path: "/contact",
  title: "Contact Us — AI Career Mentor",
  description:
    "Get in touch with the AI Career Mentor team. Support for candidates, universities, and corporate clients.",
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: absoluteUrl("/contact"),
  name: "Contact AI Career Mentor",
  description: "Get in touch with the AI Career Mentor team.",
  publisher: { "@id": `${siteConfig.url}/#organization` },
};

const contacts = [
  {
    icon: "🎓",
    audience: "Candidates & general enquiries",
    description:
      "Questions about your account, subscription, practice sessions, or anything else about the platform.",
    email: "support@aicareermentor.co.uk",
    subject: "Support%20enquiry",
    response: "We respond within one working day.",
  },
  {
    icon: "🏛️",
    audience: "Universities & careers services",
    description:
      "Campus licensing, institutional pricing, procurement documentation, and onboarding for careers teams.",
    email: "universities@aicareermentor.co.uk",
    subject: "University%20enquiry",
    response: "We respond within one working day.",
  },
  {
    icon: "🏢",
    audience: "Corporate & hiring teams",
    description:
      "Assessment centre platform, candidate invites, custom templates, and enterprise pricing.",
    email: "corporate@aicareermentor.co.uk",
    subject: "Corporate%20enquiry",
    response: "We respond within one working day.",
  },
];

const faqs = [
  {
    q: "I can't log in to my account.",
    a: "Try resetting your password from the sign-in page. If you signed up with Google, use the Google sign-in button. If you're still stuck, email support and include the email address you used to sign up.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "Go to your Profile page → Billing → Manage billing. This opens the Stripe customer portal where you can cancel at any time. You keep access until the end of your current billing period.",
  },
  {
    q: "Can I get a refund?",
    a: "Email support@aicareermentor.co.uk within 7 days of your payment and we'll sort it out.",
  },
  {
    q: "My voice recording isn't working.",
    a: "Make sure you've allowed microphone access in your browser (look for the mic icon in the address bar). Chrome and Edge work best. Safari on iOS requires a manual tap to start recording.",
  },
];

export default function ContactPage() {
  return (
    <PublicShell currentPath="/contact">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 pb-12 pt-6 text-center sm:px-6 sm:pt-10">
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
            Get in touch
          </p>
          <h1 className="mx-auto max-w-3xl text-[2.2rem] font-black leading-[1.06] tracking-[-0.05em] sm:text-5xl">
            How can we{" "}
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              help you?
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-gray-400">
            Choose the right team below and we&rsquo;ll get back to you within one working day.
          </p>
        </section>

        {/* Contact cards */}
        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-3">
            {contacts.map((c) => (
              <div
                key={c.audience}
                className="flex flex-col rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-7"
              >
                <p className="mb-3 text-3xl">{c.icon}</p>
                <h2 className="mb-3 font-black leading-tight text-white">
                  {c.audience}
                </h2>
                <p className="mb-5 flex-1 text-sm leading-6 text-gray-400">
                  {c.description}
                </p>
                <a
                  href={`mailto:${c.email}?subject=${c.subject}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]"
                >
                  Email us →
                </a>
                <p className="mt-3 text-xs text-gray-600">{c.email}</p>
                <p className="mt-1 text-xs text-gray-600">{c.response}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-black tracking-[-0.04em] sm:text-3xl">
            Common questions
          </h2>
          <div className="grid gap-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
              >
                <p className="mb-2 font-black text-white">{faq.q}</p>
                <p className="text-sm leading-6 text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
