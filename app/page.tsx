import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

export const metadata: Metadata = createPageMetadata({
  path: "/",
  title: "AI Career Mentor — Interview Practice & AI Assessment Platform",
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

/**
 * Split landing — the user's first decision is which side of the platform
 * they're here for. No nav, no extra distractions: one choice, then we send
 * them into the right product universe with its own branding, sign-in, and
 * workflow.
 */
export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0614] text-white">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.18] blur-[160px]" />
        <div className="absolute right-[-160px] bottom-[-80px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.18] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        {/* Top bar — minimal: logo + sign-in shortcut */}
        <header className="mb-10 flex items-center justify-between sm:mb-14">
          <SiteLogo href="/" size="md" showText />
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/for-candidates"
              className="rounded-full border border-purple-300/20 bg-purple-300/[0.07] px-4 py-2 text-xs font-black text-purple-100 transition hover:bg-purple-300/[0.12]"
            >
              Candidates
            </Link>
            <Link
              href="/for-business"
              className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/[0.07] px-4 py-2 text-xs font-black text-fuchsia-100 transition hover:bg-fuchsia-300/[0.12]"
            >
              Corporates
            </Link>
          </div>
        </header>

        {/* Headline */}
        <section className="mb-10 text-center sm:mb-14 lg:mb-16">
          <p className="mx-auto mb-5 inline-flex items-center gap-2.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Now live · Beta
          </p>

          <h1 className="mx-auto max-w-5xl text-[2.6rem] font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-[4rem] xl:text-[4.5rem]">
            Two sides of the same platform.{" "}
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              One built for candidates. One built for hiring teams.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg sm:leading-9">
            Pick the side that&rsquo;s right for you. Each side has its own
            workflow, sign-in and product — so you only see what matters
            to you.
          </p>
        </section>

        {/* Two-path cards */}
        <section className="mb-10 grid flex-1 gap-5 lg:grid-cols-2 lg:gap-7">
          {/* Candidate side */}
          <Link
            href="/for-candidates"
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
              <li className="flex items-start gap-3">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                Tailored interview practice for your exact role and level
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                Mock assessment centre — case study, interview, presentation
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                Voice delivery, camera presence and answer quality scored
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                Progress saved across every session
              </li>
            </ul>

            <div className="mt-auto pt-8">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-base font-black text-white shadow-2xl shadow-purple-900/40 transition group-hover:scale-[1.02]">
                I&rsquo;m a candidate →
              </span>
              <p className="mt-3 text-xs text-gray-500">
                Free to start. No credit card required.
              </p>
            </div>
          </Link>

          {/* Hiring team side */}
          <Link
            href="/for-business"
            className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/[0.08] via-fuchsia-500/[0.04] to-transparent p-7 shadow-2xl shadow-fuchsia-950/30 transition hover:-translate-y-1 hover:border-fuchsia-400/40 hover:from-fuchsia-500/[0.12] sm:p-9 lg:p-10"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/[0.18] blur-3xl transition group-hover:bg-fuchsia-500/[0.28]" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-orange-400/[0.10] blur-3xl" />

            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-fuchsia-300/90">
              For hiring teams
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              Run structured AI assessments{" "}
              <span className="bg-gradient-to-r from-fuchsia-200 via-pink-200 to-orange-200 bg-clip-text text-transparent">
                at scale.
              </span>
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-300">
              The fairest, fastest way to screen candidates. Build your own
              assessment templates, send invite links, and review structured
              scoring across every applicant.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
                Custom assessment templates for any role
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
                Email invites — candidates take it on their own time
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
                Recruiter dashboard with full scoring + transcripts
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
                UK GDPR &amp; DPA-ready
              </li>
            </ul>

            <div className="mt-auto pt-8">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-7 py-4 text-base font-black text-white shadow-2xl shadow-fuchsia-900/40 transition group-hover:scale-[1.02]">
                We&rsquo;re a hiring team →
              </span>
              <p className="mt-3 text-xs text-gray-500">
                Custom pricing. Talk to our team.
              </p>
            </div>
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-auto border-t border-white/[0.06] pt-6 text-xs text-gray-600">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} AI Career Mentor Ltd · England &amp; Wales
            </p>
            <div className="flex flex-wrap gap-5">
              <Link href="/privacy" className="hover:text-gray-400">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-400">Terms</Link>
              <Link href="/for-candidates" className="hover:text-gray-400">
                Candidates
              </Link>
              <Link href="/for-business" className="hover:text-gray-400">
                Corporates
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
