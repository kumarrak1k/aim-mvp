import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import {
  GlassCard,
  MarketingShell,
  SectionHeading,
} from "../components/marketing/MarketingShell";

export const metadata: Metadata = createPageMetadata({
  path: "/platform",
  title: "AI Interview Coaching Platform",
  description:
    "Explore the AI Career Mentor platform for tailored mock interviews, answer review, voice coaching, camera presence feedback and practical interview improvement.",
  keywords: [
    "AI interview coaching platform",
    "mock interview platform",
    "AI interview practice platform",
    "voice interview feedback",
    "camera presence feedback",
  ],
});

const platformFeatures = [
  {
    title: "Tailored interview setup",
    description:
      "Choose role, interview type, level, difficulty and focus area so the interview feels relevant and realistic.",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Natural question playback",
    description:
      "Questions are presented with more natural-sounding playback to make practice feel more human and engaging.",
    image:
      "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Transcript and answer review",
    description:
      "Capture your response, review the transcript and refine your answers with clearer structure and stronger evidence.",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Performance insight",
    description:
      "See scores for answers, voice and camera presence with strengths, weaknesses and next actions.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function PlatformPage() {
  return (
    <MarketingShell currentPath="/platform">
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            align="center"
            eyebrow="Platform"
            title="A premium interview practice platform built for real improvement."
            description="AI Career Mentor combines tailored setup, natural question playback, transcript review and clear performance insight into a practice experience designed to help candidates improve faster."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          {platformFeatures.map((feature) => (
            <article
              key={feature.title}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/20 backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/[0.07]"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120d1e]/70 via-[#120d1e]/10 to-transparent" />
              </div>

              <div className="p-6 sm:p-7">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">
                  Core capability
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                  {feature.title}
                </h2>
                <p className="mt-4 text-base leading-8 text-gray-300">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <GlassCard className="mt-10 p-6 sm:p-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-purple-300">
                Why it feels premium
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                One product, one flow, one clear outcome.
              </h2>
              <p className="mt-4 text-base leading-8 text-gray-300">
                The platform is designed to feel focused and intentional:
                tailored setup, guided practice, clear scoring and practical
                recommendations. Every element supports one goal: helping the
                candidate perform better in real interviews.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  "Tailored setup",
                  "Natural playback",
                  "Transcript clarity",
                  "Performance scoring",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm font-semibold text-gray-200"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/practice"
                  className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-center text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]"
                >
                  Start Practising
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-2xl border border-white/10 bg-white/[0.07] px-7 py-4 text-center text-sm font-black text-white transition hover:bg-white/[0.12]"
                >
                  View pricing
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/25">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80"
                alt="Professional coaching environment"
                className="h-[360px] w-full object-cover"
              />
            </div>
          </div>
        </GlassCard>
      </section>
    </MarketingShell>
  );
}