import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { absoluteUrl, siteConfig } from "@/app/config/site";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";

export const metadata: Metadata = createPageMetadata({
  path: "/security",
  title: "Security",
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  url: absoluteUrl("/security"),
  name: "Security & Data Protection | AI Career Mentor",
  description:
    "How AI Career Mentor protects your data: encryption, access controls, subprocessors, and GDPR compliance.",
  publisher: { "@id": `${siteConfig.url}/#organization` },
};

const subprocessors = [
  {
    name: "Clerk",
    purpose: "Authentication and session management",
    location: "US (EU data stored in EU region)",
    link: "https://clerk.com/security",
  },
  {
    name: "OpenAI",
    purpose: "AI analysis of interview answers and transcripts",
    location: "US",
    link: "https://openai.com/security",
  },
  {
    name: "Neon",
    purpose: "PostgreSQL database (candidate profiles, sessions)",
    location: "UK (AWS eu-west-2, London)",
    link: "https://neon.tech/security",
  },
  {
    name: "Vercel",
    purpose: "Hosting and edge delivery",
    location: "Global CDN, origin EU/US",
    link: "https://vercel.com/security",
  },
  {
    name: "Resend",
    purpose: "Transactional email (assessment invites)",
    location: "US",
    link: "https://resend.com/security",
  },
];

const controls = [
  {
    area: "Transport encryption",
    detail: "All traffic served over HTTPS with HSTS enforced (max-age 63072000, includeSubDomains, preload). TLS 1.2+ enforced at the CDN layer.",
  },
  {
    area: "Data at rest",
    detail: "All database data encrypted at rest by Neon (AES-256). Clerk session tokens stored encrypted. No sensitive data stored in plain text.",
  },
  {
    area: "Authentication",
    detail: "Managed by Clerk, with industry-standard OAuth2/OIDC flows, brute-force protection, and session expiry. We never handle raw passwords.",
  },
  {
    area: "Camera data",
    detail: "Camera video is processed entirely in your browser using MediaPipe. No video frames are sent to our servers. No video is stored.",
  },
  {
    area: "Voice/audio",
    detail: "Live transcription uses your browser's built-in speech recognition. For filler-word and delivery analysis a short audio clip is sent to OpenAI's Whisper API, transcribed, and then discarded. It is not stored on our servers. Voice mode is optional.",
  },
  {
    area: "Access controls *",
    detail: "Protected API routes require authenticated Clerk session tokens. Unauthenticated requests to protected endpoints return 401. Rate limiting applied to all AI endpoints.",
  },
  {
    area: "Security headers",
    detail: "HSTS, X-Frame-Options (SAMEORIGIN), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy (camera/microphone self-only), X-XSS-Protection enforced on all responses.",
  },
  {
    area: "Dependency management",
    detail: "Dependencies reviewed regularly. Production build runs against locked package versions. Critical CVEs addressed as a priority.",
  },
];

export default function SecurityPage() {
  return (
    <CandidateShell currentPath="/security">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6">
        <section className="mb-14 text-center">
          <h1 className="text-3xl font-bold leading-[1.04] tracking-tight sm:text-4xl">
            Security & data protection
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-gray-400">
            How we protect your data, from the moment you start a practice
            session to long after you&rsquo;ve landed the job.
          </p>
        </section>

        {/* Controls */}
        <section className="mb-14">
          <h2 className="mb-7 text-2xl font-bold tracking-tight">Security controls</h2>
          <div className="divide-y divide-white/[0.06] rounded-[2rem] border border-white/[0.08] bg-white/[0.02]">
            {controls.map((c) => (
              <div key={c.area} className="px-7 py-6">
                <p className="mb-1.5 font-bold text-white">{c.area}</p>
                <p className="text-sm leading-6 text-gray-400">{c.detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-gray-500">
            * Two endpoints are intentionally public by design:{" "}
            <span className="font-mono text-gray-400">/tools/star-scorer</span> (free
            STAR answer scorer, IP-rate-limited to 5 requests per hour) and{" "}
            <span className="font-mono text-gray-400">/api/assessment/[token]</span>{" "}
            (assessment invites issued by hiring teams using single-use cryptographic
            tokens). Neither endpoint exposes personal candidate data.
          </p>
        </section>

        {/* Subprocessors */}
        <section className="mb-14">
          <h2 className="mb-3 text-2xl font-bold tracking-tight">Sub-processors</h2>
          <p className="mb-7 text-sm text-gray-500">
            We use the following third-party services to operate the platform. Each
            is bound by a Data Processing Agreement where required under UK GDPR.
          </p>
          <div className="overflow-hidden rounded-[2rem] border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-wide text-gray-500">
                    Processor
                  </th>
                  <th className="hidden px-6 py-4 text-left text-xs font-bold tracking-wide text-gray-500 sm:table-cell">
                    Purpose
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-wide text-gray-500">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {subprocessors.map((sp) => (
                  <tr key={sp.name} className="transition hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <a
                        href={sp.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-purple-300 hover:text-purple-200"
                      >
                        {sp.name}
                      </a>
                    </td>
                    <td className="hidden px-6 py-4 text-gray-400 sm:table-cell">
                      {sp.purpose}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{sp.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* GDPR rights */}
        <section className="mb-14 rounded-[2rem] border border-purple-300/15 bg-purple-300/[0.04] p-8">
          <h2 className="mb-4 text-xl font-bold tracking-tight">Your rights under UK GDPR</h2>
          <p className="mb-4 text-sm leading-7 text-gray-400">
            You have the right to access, correct, export, and delete your data at
            any time. Most of these actions are available directly from your{" "}
            <Link href="/profile" className="text-purple-300 hover:text-purple-200">
              profile page
            </Link>
            . For requests we cannot fulfil automatically, contact us at{" "}
            <a
              href="mailto:privacy@aicareermentor.co.uk"
              className="text-purple-300 hover:text-purple-200"
            >
              privacy@aicareermentor.co.uk
            </a>{" "}
            and we will respond within 30 days.
          </p>
        </section>

        {/* Disclosure */}
        <section className="mb-14">
          <h2 className="mb-4 text-xl font-bold tracking-tight">
            Responsible disclosure
          </h2>
          <p className="text-sm leading-7 text-gray-400">
            If you discover a security vulnerability, please report it to{" "}
            <a
              href="mailto:security@aicareermentor.co.uk"
              className="text-purple-300 hover:text-purple-200"
            >
              security@aicareermentor.co.uk
            </a>{" "}
            with a clear description and reproduction steps. We will acknowledge
            receipt within 48 hours and work to resolve critical issues as a priority.
            We ask that you do not publicly disclose vulnerabilities before we have
            had a reasonable opportunity to address them.
          </p>
        </section>

        {/* Enterprise */}
        <section className="rounded-[2rem] border border-fuchsia-300/15 bg-fuchsia-300/[0.04] p-8 text-center">
          <h2 className="mb-2 text-xl font-bold tracking-tight">
            Need a DPA or security review?
          </h2>
          <p className="mb-5 text-sm text-gray-400">
            Enterprise customers can request a Data Processing Agreement, our
            security questionnaire responses, or a compliance call with our team.
          </p>
          <a
            href="mailto:security@aicareermentor.co.uk?subject=Enterprise%20security%20review"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-7 py-3.5 text-sm font-bold text-white shadow-xl transition hover:scale-[1.02]"
          >
            Contact enterprise team →
          </a>
        </section>
      </div>
    </CandidateShell>
  );
}
