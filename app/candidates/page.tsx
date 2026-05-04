"use client";

import Link from "next/link";
import {
  BulletList,
  GlassCard,
  MarketingShell,
  SectionHeading,
} from "../components/marketing/MarketingShell";

const audienceCards = [
  {
    title: "Graduates and early-career candidates",
    text: "Build structure, confidence and better examples for internships, placements and first professional roles.",
  },
  {
    title: "Career changers",
    text: "Translate transferable skills into answers that feel relevant, specific and persuasive.",
  },
  {
    title: "Experienced professionals",
    text: "Refine strategic answers, leadership examples and executive presence for higher-stakes interviews.",
  },
];

export default function CandidatesPage() {
  return (
    <MarketingShell currentPath="/candidates">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="Candidates"
              title="Built for candidates at different career stages."
              description="The product is designed to support a wide range of career situations, while still helping each user prepare in a structured and focused way."
            />
          </div>

          <GlassCard className="overflow-hidden p-0">
            <img
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80"
              alt="Diverse professionals in discussion"
              className="h-full min-h-[360px] w-full object-cover"
            />
          </GlassCard>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {audienceCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[1.8rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-black/10"
            >
              <h3 className="text-2xl font-black tracking-[-0.04em]">
                {card.title}
              </h3>
              <p className="mt-4 leading-7 text-gray-300">{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="grid gap-6 lg:grid-cols-[0.98fr_1.02fr]">
          <GlassCard>
            <SectionHeading
              eyebrow="Use cases"
              title="Helpful when the interview matters."
              description="Candidates often use the platform before important applications or interviews where they want sharper answers and more confidence."
            />

            <div className="mt-6">
              <BulletList
                items={[
                  "Preparing for internship, graduate or placement interviews.",
                  "Practising before a role change or industry move.",
                  "Improving confidence before a remote interview.",
                  "Refining leadership examples for more senior opportunities.",
                  "Getting repeated practice before a final-stage interview.",
                ]}
              />
            </div>

            <div className="mt-7">
              <Link href="/practice">
                <button className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-base font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.02]">
                  Start Practising
                </button>
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="overflow-hidden p-0">
            <img
              src="https://images.unsplash.com/photo-1573496799515-eebbb63814f2?auto=format&fit=crop&w=1400&q=80"
              alt="Candidate preparing for a professional interview"
              className="h-full min-h-[360px] w-full object-cover"
            />
          </GlassCard>
        </div>
      </section>
    </MarketingShell>
  );
}