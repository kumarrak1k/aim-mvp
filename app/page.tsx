import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { absoluteUrl } from "@/app/config/site";
import { SiteLogo } from "@/app/components/brand/SiteLogo";
import { DemoVideo } from "@/app/components/marketing/DemoVideo";
import { SiteFooter } from "@/app/components/marketing/SiteFooter";
import { DataTrustStrip } from "@/app/components/DataTrustStrip";
import { ResourceLinksRow } from "@/app/components/marketing/ResourceLinksRow";
import { TrialBadge } from "@/app/components/marketing/TrialBadge";

export const metadata: Metadata = createPageMetadata({
  path: "/",
  title: "AI Interview Practice Online & AI Assessment Platform | AI Career Mentor",
  description:
    "Two products in one. AI Career Mentor helps candidates prepare for interviews and assessment centres, and gives hiring teams a structured AI assessment platform.",
  keywords: [
    "AI interview practice",
    "AI assessment centre",
    "AI assessment platform",
    "interview practice for candidates",
    "AI hiring assessment",
    "AI Career Mentor",
  ],
});

const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${absoluteUrl("/")}#organization`,
      name: "AI Career Mentor",
      url: absoluteUrl("/"),
      description:
        "UK-built AI coaching platform giving candidates and hiring teams structured, honest interview preparation at scale.",
      foundingDate: "2024",
      areaServed: "GB",
      knowsAbout: [
        "interview preparation",
        "career coaching",
        "assessment centres",
        "AI coaching",
        "competency frameworks",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${absoluteUrl("/")}#app`,
      name: "AI Career Mentor",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: absoluteUrl("/"),
      description:
        "AI interview practice and assessment platform. Tailored questions, voice and camera coaching, and structured hiring assessments.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "GBP",
        description: "Free to start (no credit card required)",
      },
      provider: { "@id": `${absoluteUrl("/")}#organization` },
    },
  ],
};

const stats = [
  { value: "6", label: "dimensions scored per answer", grad: "from-purple-300 to-fuchsia-300", glow: "bg-purple-500/25" },
  { value: "360°", label: "answer, voice & camera coaching", grad: "from-fuchsia-300 to-pink-300", glow: "bg-fuchsia-500/25" },
  { value: "8+", label: "interview types covered", grad: "from-cyan-300 to-blue-300", glow: "bg-cyan-500/25" },
  { value: "7-day", label: "personalised improvement plan", grad: "from-amber-200 to-orange-300", glow: "bg-amber-500/25" },
];

const capabilities = [
  {
    title: "Tailored to you",
    body: "Questions generated for your exact role, level, and interview type, not a generic bank.",
    icon: "target",
    border: "border-purple-500/25",
    glow: "bg-purple-500/30",
    iconGrad: "from-purple-400 to-fuchsia-500",
    titleGrad: "from-purple-200 to-fuchsia-200",
  },
  {
    title: "360° coaching",
    body: "Answer quality, voice delivery, filler words, and camera presence all scored in one session.",
    icon: "mic",
    border: "border-fuchsia-500/25",
    glow: "bg-fuchsia-500/30",
    iconGrad: "from-fuchsia-400 to-pink-500",
    titleGrad: "from-fuchsia-200 to-pink-200",
  },
  {
    title: "Structured improvement",
    body: "Model answers, specific feedback, and a 7-day plan after every practice session.",
    icon: "trending",
    border: "border-cyan-500/25",
    glow: "bg-cyan-500/30",
    iconGrad: "from-cyan-400 to-blue-500",
    titleGrad: "from-cyan-200 to-blue-200",
  },
];

/** Small inline icons for the capability cards (rendered in a gradient badge). */
function CapabilityIcon({ name }: { name: string }) {
  if (name === "target") {
    return (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "mic") {
    return (
      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M17 7h4v4" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="relative bg-[#0a0614] text-white">
      {/* Background atmosphere — fixed so gradient covers footer too, matching PublicShell */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.18] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.18] blur-[160px]" />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
      />
      {/* Data trust bar — top of homepage */}
      <DataTrustStrip variant="topbar" />
    <main className="relative z-10 min-h-screen">

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 pt-1.5 pb-6 sm:px-6 sm:pt-2 sm:pb-8 lg:px-10">
        {/* Top bar */}
        <header className="relative mb-10 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center sm:mb-14">
          <SiteLogo href="/" size="md" showText className="relative z-10" />

          {/* Universal nav — centred in the grid column between logo and buttons.
              Grid prevents overlap at any width; shown at lg+ (1024px). */}
          <nav aria-label="Primary" className="hidden min-w-0 justify-center lg:flex">
            <div className="flex items-center gap-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] p-1">
              {[
                { href: "/about", label: "About us" },
                { href: "/blog", label: "Interview guides" },
                { href: "/questions", label: "Question library" },
                { href: "/tools/star-scorer", label: "Free STAR scorer" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-bold text-gray-400 transition hover:bg-white/[0.07] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Phone-only compact CTA — the audience pills below need sm+, and
              without this the phone header has no action at all. */}
          <Link
            href="/for-candidates"
            className="col-start-3 relative z-10 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-purple-900/40 sm:hidden"
          >
            Start free
          </Link>

          {/* Audience buttons — signed-out visitors also get a per-audience Sign in */}
          <div className="col-start-3 relative z-10 hidden shrink-0 items-start gap-2 sm:flex">
            <div className="flex flex-col items-center gap-1.5">
              <Link
                href="/for-candidates"
                className="rounded-full border border-purple-300/20 bg-purple-300/[0.07] px-4 py-2 text-xs font-black text-purple-100 transition hover:bg-purple-300/[0.12]"
              >
                Candidates
              </Link>
              <Link
                href="/for-candidates/sign-in"
                className="rounded-full bg-violet-600 px-4 py-1 text-[11px] font-black text-white transition hover:bg-violet-500"
              >
                Sign in
              </Link>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Link
                href="/for-business"
                className="rounded-full border border-purple-300/20 bg-purple-300/[0.07] px-4 py-2 text-xs font-black text-purple-100 transition hover:bg-purple-300/[0.12]"
              >
                Corporates
              </Link>
              <Link
                href="/for-business/sign-in"
                className="rounded-full bg-fuchsia-600 px-4 py-1 text-[11px] font-black text-white transition hover:bg-fuchsia-500"
              >
                Sign in
              </Link>
            </div>
            <Link
              href="/universities"
              className="rounded-full border border-purple-300/20 bg-purple-300/[0.07] px-4 py-2 text-xs font-black text-purple-100 transition hover:bg-purple-300/[0.12]"
            >
              Universities
            </Link>
          </div>
        </header>

        {/* Mobile resource links — lg+ shows these in the centred nav above */}
        <div className="mb-8 -mt-4 lg:hidden">
          <ResourceLinksRow scroll className="px-0.5" />
        </div>

        {/* Hero */}
        <section className="mb-10 text-center sm:mb-14 lg:mb-16">
          <TrialBadge audience="candidate" className="mx-auto mb-6" />
          <h1 className="mx-auto max-w-5xl text-[2.6rem] font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-[4rem] xl:text-[4.5rem]">
            The AI interview coach that{" "}
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              scores answers, voice, and camera presence.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg sm:leading-9">
            Practise interviews tailored to your exact role. Get scored on
            what you say, how you sound, and how you come across on camera.
            Walk in with a 7-day improvement plan.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/for-candidates/sign-up"
              className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-8 py-4 text-base font-black text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02] sm:w-auto"
            >
              Start free for candidates →
            </Link>
            <Link
              href="/tools/star-scorer"
              className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-base font-black text-white transition hover:bg-white/[0.08] sm:w-auto"
            >
              Try free STAR scorer
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Every new account starts with a{" "}
            <span className="font-bold text-gray-300">3-day free trial</span>:
            unlimited practice with voice &amp; camera coaching. No payment details required.
            After it ends, keep practising on the free tier (3 sessions) or upgrade anytime.
          </p>
        </section>

        {/* Demo video */}
        <section className="mb-10 sm:mb-14">
          <DemoVideo src="/videos/product-demo.mp4" poster="/videos/candidate-poster.jpg" />
        </section>

        {/* Two-path cards */}
        <section className="mb-10 grid flex-1 gap-5 lg:grid-cols-2 lg:gap-7">
          {/* Candidate side */}
          <Link
            href="/for-candidates/pricing"
            className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.08] via-purple-500/[0.04] to-transparent p-7 shadow-2xl shadow-purple-950/30 transition hover:-translate-y-1 hover:border-purple-400/40 hover:from-purple-500/[0.12] sm:p-9 lg:p-10"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-purple-500/[0.18] blur-3xl transition group-hover:bg-purple-500/[0.28]" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-cyan-400/[0.10] blur-3xl" />

            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-purple-300/90">
              For candidates
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              Practise interviews. Prepare for{" "}
              <span className="bg-gradient-to-r from-purple-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
                assessment centres.
              </span>
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-300">
              AI coaching for the moments that decide your career.
              Tailored questions for your role. Mock assessment centre exercises.
              Voice and camera presence reviewed. Progress tracked.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-gray-300">
              {[
                "Tailored interview practice for your exact role and level",
                "Mock assessment centre: case study, interview, presentation",
                "Voice delivery, camera presence and answer quality scored",
                "Progress saved across every session",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-base font-black text-white shadow-2xl shadow-purple-900/40 transition group-hover:scale-[1.02]">
                See plans &amp; free trial →
              </span>
              <p className="mt-3 text-xs text-gray-500">
                Free 3-day trial, no payment details required. Assessment centres
                are on the Professional plan.
              </p>
            </div>
          </Link>

          {/* Hiring team side */}
          <Link
            href="/for-business"
            className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.08] via-purple-500/[0.04] to-transparent p-7 shadow-2xl shadow-purple-950/30 transition hover:-translate-y-1 hover:border-purple-400/40 hover:from-purple-500/[0.12] sm:p-9 lg:p-10"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-purple-500/[0.18] blur-3xl transition group-hover:bg-purple-500/[0.28]" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-cyan-400/[0.10] blur-3xl" />

            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-purple-300/90">
              For hiring teams
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              Run structured AI assessments{" "}
              <span className="bg-gradient-to-r from-purple-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
                at scale.
              </span>
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-300">
              The fairest, fastest way to screen candidates. Build your own
              assessment templates, send invite links, and review structured
              scoring across every applicant.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-gray-300">
              {[
                "Custom assessment templates for any role",
                "Email invites: candidates take it on their own time",
                "Recruiter dashboard with full scoring + transcripts",
                "UK GDPR & DPA-ready",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-base font-black text-white shadow-2xl shadow-purple-900/40 transition group-hover:scale-[1.02]">
                We&rsquo;re a hiring team →
              </span>
              <p className="mt-3 text-xs text-gray-500">
                Custom pricing. Talk to our team.
              </p>
            </div>
          </Link>
        </section>

        {/* Free tools row */}
        <section className="mb-10 rounded-[2rem] border border-white/[0.07] bg-white/[0.02] p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-300/70">
                Free tools, no sign-in required
              </p>
              <p className="mt-1.5 text-base font-black">
                Try before you commit
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Paste your answer and get an instant STAR score with specific feedback.
              </p>
            </div>
            <Link
              href="/tools/star-scorer"
              className="shrink-0 rounded-2xl border border-purple-300/20 bg-purple-300/[0.07] px-6 py-3 text-sm font-black text-purple-100 transition hover:bg-purple-300/[0.12]"
            >
              Free STAR answer scorer →
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-10 grid grid-cols-2 gap-3 sm:mb-14 sm:gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-6 text-center transition duration-300 hover:-translate-y-1 hover:border-white/[0.18] hover:bg-white/[0.05]"
            >
              <div
                className={`pointer-events-none absolute -top-8 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full ${s.glow} opacity-50 blur-2xl transition duration-300 group-hover:opacity-100`}
              />
              <p
                className={`relative bg-gradient-to-r ${s.grad} bg-clip-text text-4xl font-black tracking-[-0.06em] text-transparent`}
              >
                {s.value}
              </p>
              <p className="relative mt-1.5 text-xs leading-5 text-gray-400">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Capabilities */}
        <section className="mb-10 grid gap-4 sm:mb-14 sm:grid-cols-3">
          {capabilities.map((c) => (
            <div
              key={c.title}
              className={`group relative overflow-hidden rounded-[1.75rem] border ${c.border} bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1.5 hover:bg-white/[0.05]`}
            >
              <div
                className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full ${c.glow} opacity-40 blur-3xl transition duration-300 group-hover:opacity-80`}
              />
              <div
                className={`relative mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${c.iconGrad} shadow-lg shadow-black/30`}
              >
                <CapabilityIcon name={c.icon} />
              </div>
              <p className={`relative bg-gradient-to-r ${c.titleGrad} bg-clip-text font-black text-transparent`}>
                {c.title}
              </p>
              <p className="relative mt-2 text-sm leading-6 text-gray-400">{c.body}</p>
            </div>
          ))}
        </section>

      </div>
    </main>
    <SiteFooter />
    </div>
  );
}
