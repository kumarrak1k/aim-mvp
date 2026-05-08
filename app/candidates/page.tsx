import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import {
  BulletList,
  GlassCard,
  MarketingShell,
  SectionHeading,
} from "../components/marketing/MarketingShell";

export const metadata: Metadata = createPageMetadata({
  path: "/candidates",
  title: "Interview Practice for Graduates, Career Changers and Professionals",
  description:
    "AI Career Mentor helps graduates, career changers and experienced professionals practise stronger interview answers, voice delivery and camera presence.",
  keywords: [
    "interview practice for graduates",
    "career changer interview practice",
    "professional interview coaching",
    "graduate mock interview",
    "career change interview preparation",
    "executive presence interview practice",
  ],
});

const audienceCards = [
  {
    title: "Graduates and early-career candidates",
    text: "You know what the job asks for — but your examples feel vague and your answers trail off. Practice gives you structure, stronger evidence and the confidence to fill silences without rambling.",
  },
  {
    title: "Career changers",
    text: "Your experience is real — but interviewers can't see the connection. Practice helps you translate what you've done into answers that land in a new industry or function.",
  },
  {
    title: "Experienced professionals",
    text: "Stakes are higher. Interviewers expect sharper answers, clearer leadership examples and a more polished presence. Practice at the right level removes the rust before the real thing.",
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
              title="Your competition is preparing. Are you?"
              description="Most candidates walk into interviews hoping for the best. The ones who get offers practised until the answers came naturally. AI Career Mentor makes that practice fast, specific and honest."
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
              eyebrow="When to use it"
              title="Use it when the interview actually matters."
              description="The best time to practise is the week before — when there's still time to fix your answers but the pressure is real enough to focus you."
            />

            <div className="mt-6">
              <BulletList
                items={[
                  "You have a first-round interview in less than a week.",
                  "You're changing roles or industries and your examples feel stale.",
                  "You froze or rambled in your last interview and want to fix it.",
                  "You're applying to a role where the competition is serious.",
                  "You want to know what you actually sound like before someone else does.",
                ]}
              />
            </div>

            <div className="mt-7">
              <Link
                href="/practice"
                className="inline-flex rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-base font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.02]"
              >
                Start Practising
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