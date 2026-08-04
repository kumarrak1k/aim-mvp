import type { Metadata } from "next";
import { createPageMetadata } from "@/app/config/seo";
import { absoluteUrl, siteConfig } from "@/app/config/site";
import { CopyBoilerplate } from "./CopyBoilerplate";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";

export const metadata: Metadata = createPageMetadata({
  path: "/press",
  title: "Press & Media",
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  url: absoluteUrl("/press"),
  name: "Press & Media Kit | AI Career Mentor",
  description:
    "Press kit, brand assets, key statistics, and media contact for AI Career Mentor.",
  publisher: { "@id": `${siteConfig.url}/#organization` },
};

const stats = [
  { label: "Interview sessions available", value: "Unlimited" },
  { label: "Feedback dimensions scored", value: "6" },
  { label: "Countries where users practise", value: "Global" },
  { label: "Founded", value: "2025" },
  { label: "Based in", value: "United Kingdom" },
  { label: "Data residency", value: "EU/UK" },
];

const boilerplate = `AI Career Mentor is a UK-built AI coaching platform that helps candidates prepare for job interviews and assessment centres, and gives hiring teams a structured AI assessment platform for fair, scalable screening. The platform scores answer quality, voice delivery and camera presence in real time, and produces a personalised 7-day improvement plan for every candidate. AI Career Mentor is based in the United Kingdom and processes all data under UK GDPR.`;

export default function PressPage() {
  return (
    <CandidateShell currentPath="/press">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6">
        <section className="mb-14 text-center">
          <h1 className="text-3xl font-bold leading-[1.04] tracking-tight sm:text-4xl">
            Media kit & press resources
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-gray-400">
            For press enquiries, interview requests, or to request additional materials,
            contact{" "}
            <a
              href="mailto:press@aicareermentor.co.uk"
              className="font-semibold text-purple-300 hover:text-purple-200"
            >
              press@aicareermentor.co.uk
            </a>
          </p>
        </section>

        {/* Boilerplate */}
        <section className="mb-12 rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-8">
          <h2 className="mb-4 text-lg font-bold tracking-tight">Boilerplate</h2>
          <p className="text-sm leading-7 text-gray-400">{boilerplate}</p>
          <CopyBoilerplate text={boilerplate} />
        </section>

        {/* Key stats */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold tracking-tight">Key facts</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
              >
                <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="mt-1 text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Brand assets */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold tracking-tight">Brand assets</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
              <div>
                <p className="font-bold">Logo (SVG + PNG)</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Light and dark variants
                </p>
              </div>
              <a
                href="mailto:press@aicareermentor.co.uk?subject=Brand%20assets%20request"
                className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-gray-300 transition hover:bg-white/[0.09]"
              >
                Request
              </a>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
              <div>
                <p className="font-bold">Product screenshots</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Dashboard, session, feedback views
                </p>
              </div>
              <a
                href="mailto:press@aicareermentor.co.uk?subject=Screenshot%20request"
                className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-gray-300 transition hover:bg-white/[0.09]"
              >
                Request
              </a>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-600">
            Brand guidelines: primary gradient purple (#7C3AED) → fuchsia (#D946EF) → blue (#3B82F6).
            Background: #0a0614. Always use on dark backgrounds.
          </p>
        </section>

        {/* Usage guidelines */}
        <section className="mb-12 rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-6">
          <h2 className="mb-3 font-bold text-amber-200">Usage guidelines</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Always refer to the product as &ldquo;AI Career Mentor&rdquo;; do not abbreviate</li>
            <li>• Do not alter the logo colours or proportions</li>
            <li>• Do not imply endorsement without written permission</li>
            <li>• Factual claims should reference official statistics from this page</li>
          </ul>
        </section>

        {/* Contact */}
        <section className="text-center">
          <p className="text-gray-400">
            Press contact:{" "}
            <a
              href="mailto:press@aicareermentor.co.uk"
              className="font-bold text-purple-300 hover:text-purple-200"
            >
              press@aicareermentor.co.uk
            </a>
          </p>
          <p className="mt-2 text-sm text-gray-600">
            We aim to respond to press enquiries within 24 hours.
          </p>
        </section>
      </div>
    </CandidateShell>
  );
}
