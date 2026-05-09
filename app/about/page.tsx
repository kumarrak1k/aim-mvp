import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { absoluteUrl, siteConfig } from "@/app/config/site";

export const metadata: Metadata = createPageMetadata({
  path: "/about",
  title: "About AI Career Mentor — Mission, Team & Story",
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: absoluteUrl("/about"),
  name: "About AI Career Mentor",
  description:
    "The mission, team, and story behind AI Career Mentor — a UK-built AI coaching platform for candidates and hiring teams.",
  mainEntity: {
    "@id": `${siteConfig.url}/#organization`,
  },
};

const values = [
  {
    title: "Honest feedback, not flattery",
    body: "Real improvement comes from knowing exactly where you fell short. Our AI gives you the truth — constructively and specifically — not the encouragement you wanted to hear.",
  },
  {
    title: "Privacy by design",
    body: "Your interview answers, CV context and coaching sessions belong to you. We never sell your data, we process only what's needed, and you can delete everything at any time.",
  },
  {
    title: "Built for the real interview room",
    body: "We coach answers, voice delivery and camera presence because all three matter. Interviewers judge the full picture — so our feedback covers it.",
  },
  {
    title: "Fair hiring starts with fair prep",
    body: "Access to quality interview coaching has always been expensive and unequal. AI lets us change that — making elite-level preparation available to everyone.",
  },
];

const team = [
  {
    name: "Founder",
    role: "CEO & Product",
    bio: "Background in talent assessment and career coaching. Built AI Career Mentor to make the kind of preparation that changes outcomes accessible to everyone — not just those who can afford a £200/hour coach.",
    linkedin: null,
  },
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0614] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,60,255,0.15),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-purple-600/[0.12] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
        {/* Back nav */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-[13px] text-gray-500 transition hover:text-gray-300"
        >
          ← Home
        </Link>

        {/* Hero */}
        <section className="mb-16 text-center">
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
            About us
          </p>
          <h1 className="text-[2.4rem] font-black leading-[1.04] tracking-[-0.055em] sm:text-5xl">
            Making elite interview prep{" "}
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              accessible to everyone
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg sm:leading-9">
            AI Career Mentor is a UK-built platform that gives candidates the kind
            of preparation that used to cost hundreds of pounds per hour — and
            gives hiring teams a structured, fair way to assess candidates at scale.
          </p>
        </section>

        {/* Mission */}
        <section className="mb-16 rounded-[2rem] border border-purple-300/15 bg-purple-300/[0.05] p-8 sm:p-10">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-purple-300/80">
            Our mission
          </p>
          <blockquote className="text-xl font-black leading-[1.4] tracking-[-0.03em] text-white sm:text-2xl">
            &ldquo;To make the gap between a good candidate and a hired one about
            preparation, not privilege.&rdquo;
          </blockquote>
        </section>

        {/* Story */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-black tracking-[-0.04em]">The story</h2>
          <div className="space-y-5 text-base leading-8 text-gray-400">
            <p>
              Interview coaching has always worked — the evidence is clear. Candidates
              who practise with structured feedback perform meaningfully better. But
              for most people, proper coaching was either unavailable or unaffordable.
            </p>
            <p>
              AI Career Mentor started with one question: what if everyone could have
              the same calibre of preparation as candidates with access to top coaches?
              Not generic practice questions, but coaching tailored to your exact role,
              level and interview format — with real feedback on answers, voice delivery
              and how you come across on camera.
            </p>
            <p>
              We built the platform in the UK, GDPR-first, and we&rsquo;re growing it
              into the tool we wish had existed when we were preparing for interviews
              ourselves.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-black tracking-[-0.04em]">What we stand for</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
              >
                <h3 className="mb-2 font-black leading-tight">{v.title}</h3>
                <p className="text-sm leading-6 text-gray-400">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-black tracking-[-0.04em]">Team</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {team.map((member) => (
              <div
                key={member.name}
                className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-blue-500">
                  <span className="text-lg font-black text-white">
                    {member.name[0]}
                  </span>
                </div>
                <p className="font-black">{member.name}</p>
                <p className="mb-3 text-xs text-purple-300/80">{member.role}</p>
                <p className="text-sm leading-6 text-gray-400">{member.bio}</p>
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 text-xs font-semibold text-purple-300 hover:text-purple-200"
                  >
                    LinkedIn →
                  </a>
                )}
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-600">
            We&rsquo;re hiring.{" "}
            <a
              href="mailto:team@aicareermentor.co.uk"
              className="text-purple-300 hover:text-purple-200"
            >
              Get in touch →
            </a>
          </p>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            href="/for-candidates"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-8 py-4 text-base font-black text-white shadow-2xl shadow-purple-950/40 transition hover:scale-[1.02]"
          >
            Start practising →
          </Link>
          <p className="mt-3 text-xs text-gray-600">Free to start. No credit card required.</p>
        </section>
      </div>
    </main>
  );
}
