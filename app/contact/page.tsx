import type { Metadata } from "next";
import { createPageMetadata } from "@/app/config/seo";
import { absoluteUrl, siteConfig } from "@/app/config/site";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";

export const metadata: Metadata = createPageMetadata({
  path: "/contact",
  title: "Contact Us",
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
    icon: "graduate" as const,
    audience: "Candidates & general enquiries",
    description:
      "Questions about your account, subscription, practice sessions, or anything else about the platform.",
    email: "support@aicareermentor.co.uk",
    subject: "Support%20enquiry",
    response: "We respond within one working day.",
  },
  {
    icon: "institution" as const,
    audience: "Universities & careers services",
    description:
      "Campus licensing, institutional pricing, procurement documentation, and onboarding for careers teams.",
    email: "universities@aicareermentor.co.uk",
    subject: "University%20enquiry",
    response: "We respond within one working day.",
  },
  {
    icon: "corporate" as const,
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
    q: "My voice recording isn't working.",
    a: "Make sure you've allowed microphone access in your browser (look for the mic icon in the address bar). Chrome and Edge work best. Safari on iOS requires a manual tap to start recording.",
  },
];

/**
 * Line icons in the site's existing idiom: 24px grid, currentColor, 1.75
 * stroke, round joins. These replaced emoji, which render as a different
 * artwork on every OS, carry no consistent weight or colour, and are read
 * aloud by screen readers ("graduation cap") as if they were content.
 */
const ContactIcon = ({ name }: { name: "graduate" | "institution" | "corporate" }) => {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-6 w-6",
    "aria-hidden": true,
  };

  if (name === "graduate") {
    return (
      <svg {...common}>
        <path d="M21.4 10.9a1 1 0 0 0 0-1.84L12.8 5.2a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.9a2 2 0 0 0 1.66 0Z" />
        <path d="M22 10v6" />
        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
      </svg>
    );
  }

  if (name === "institution") {
    return (
      <svg {...common}>
        <path d="M3 22h18" />
        <path d="M6 18v-7M10 18v-7M14 18v-7M18 18v-7" />
        <path d="M12 2 20 7H4Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
    </svg>
  );
};

export default function ContactPage() {
  return (
    <CandidateShell currentPath="/contact">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 pb-12 pt-1 text-center sm:px-6 sm:pt-3">
          <h1 className="mx-auto max-w-3xl text-[2.2rem] font-bold leading-[1.06] tracking-tight sm:text-4xl">
            How can we{" "}
            <span className="text-violet-300">
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
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/25 bg-purple-400/10 text-purple-300">
                  <ContactIcon name={c.icon} />
                </span>
                <h2 className="mb-3 font-bold leading-tight text-white">
                  {c.audience}
                </h2>
                <p className="mb-5 flex-1 text-sm leading-6 text-gray-400">
                  {c.description}
                </p>
                <a
                  href={`mailto:${c.email}?subject=${c.subject}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
                >
                  Email us →
                </a>
                <p className="mt-3 text-xs text-gray-400">{c.email}</p>
                <p className="mt-1 text-xs text-gray-400">{c.response}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Common questions
          </h2>
          <div className="grid gap-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
              >
                <p className="mb-2 font-bold text-white">{faq.q}</p>
                <p className="text-sm leading-6 text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </CandidateShell>
  );
}
