/**
 * Audience-aware marketing shell.
 *
 * Used by the post-split marketing pages — /for-candidates/* and
 * /for-business/*. Each audience gets:
 *   - its own colour identity (purple-cyan for candidate, fuchsia for business)
 *   - its own nav focused on its own product (no cross-pollination)
 *   - its own sign-in / sign-up CTAs
 *
 * The existing MarketingShell stays in place for legacy authed pages
 * (/practice, /company/*, /progress, /profile) and gets retired in
 * Session 2 when those routes are renamed and given their own shells.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

export type Audience = "candidate" | "business";

type AudienceShellProps = {
  audience: Audience;
  currentPath: string;
  children: ReactNode;
};

type AudienceTheme = {
  eyebrow: string;
  signInPath: string;
  signUpPath: string;
  navItems: Array<{ href: string; label: string }>;
  primaryGradient: string;
  primaryShadow: string;
  accentBorder: string;
  accentTextSoft: string;
  accentTextStrong: string;
  switchAudienceLabel: string;
  switchAudienceHref: string;
};

const THEMES: Record<Audience, AudienceTheme> = {
  candidate: {
    eyebrow: "For candidates",
    signInPath: "/for-candidates/sign-in",
    signUpPath: "/for-candidates/sign-up",
    navItems: [
      { href: "/for-candidates", label: "Overview" },
      {
        href: "/for-candidates/interview-practice",
        label: "Interview practice",
      },
      {
        href: "/for-candidates/assessment-centre",
        label: "Assessment centre",
      },
      { href: "/for-candidates/pricing", label: "Pricing" },
    ],
    primaryGradient:
      "from-purple-500 via-fuchsia-500 to-blue-500",
    primaryShadow: "shadow-purple-900/40",
    accentBorder: "border-purple-300/20",
    accentTextSoft: "text-purple-300/90",
    accentTextStrong: "text-purple-100",
    switchAudienceLabel: "I'm a hiring team →",
    switchAudienceHref: "/for-business",
  },
  business: {
    eyebrow: "For hiring teams",
    signInPath: "/for-business/sign-in",
    signUpPath: "/for-business/sign-up",
    navItems: [
      { href: "/for-business", label: "Overview" },
      {
        href: "/for-business/assessment-platform",
        label: "Platform",
      },
      { href: "/for-business/pricing", label: "Pricing" },
    ],
    primaryGradient: "from-fuchsia-500 to-purple-500",
    primaryShadow: "shadow-fuchsia-900/40",
    accentBorder: "border-fuchsia-300/20",
    accentTextSoft: "text-fuchsia-300/90",
    accentTextStrong: "text-fuchsia-100",
    switchAudienceLabel: "I'm a candidate →",
    switchAudienceHref: "/for-candidates",
  },
};

export function AudienceShell({
  audience,
  currentPath,
  children,
}: AudienceShellProps) {
  const theme = THEMES[audience];

  return (
    <div className="relative min-h-screen bg-[#0a0614] text-white">
      {/* Background atmosphere — tinted by audience */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        {audience === "candidate" ? (
          <>
            <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.18] blur-[160px]" />
            <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.18] blur-[160px]" />
          </>
        ) : (
          <>
            <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.18] blur-[160px]" />
            <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.15] blur-[160px]" />
          </>
        )}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0a0614]/60 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8 lg:py-3.5">
          {/* Logo + audience badge */}
          <Link
            href={audience === "candidate" ? "/for-candidates" : "/for-business"}
            className="flex shrink-0 items-center gap-3"
          >
            <SiteLogo href="" size="md" showText />
            <span
              className={`hidden rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] sm:inline-block ${theme.accentBorder} bg-white/[0.04] ${theme.accentTextStrong}`}
            >
              {theme.eyebrow}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-1 lg:flex lg:justify-center">
            <div className="flex items-center gap-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] p-1.5">
              {theme.navItems.map((item) => {
                const active = currentPath === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={`block whitespace-nowrap rounded-full px-3 py-2 text-[12.5px] font-bold transition xl:px-4 xl:text-[13px] ${
                        active
                          ? "bg-white/[0.12] text-white shadow-sm"
                          : "text-gray-400 hover:bg-white/[0.07] hover:text-white"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right actions — audience-only, no cross-audience switch in the
              header. Switching audiences is intentionally a deliberate action,
              done via "/" or the small footer link. */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link href={theme.signInPath}>
              <button className="hidden whitespace-nowrap rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-[13px] font-bold text-white/80 transition hover:bg-white/[0.08] hover:text-white sm:block">
                Sign in
              </button>
            </Link>

            <Link href={theme.signUpPath}>
              <button
                className={`whitespace-nowrap rounded-full bg-gradient-to-r ${theme.primaryGradient} px-4 py-2.5 text-[13px] font-black text-white shadow-lg ${theme.primaryShadow} transition hover:scale-[1.03] sm:px-5 xl:px-6`}
              >
                {audience === "candidate" ? "Start free" : "Get started"}
              </button>
            </Link>
          </div>
        </div>

        {/* Tablet/mobile compact nav row — audience-only */}
        <div className="border-t border-white/[0.05] px-4 py-2 sm:px-6 lg:hidden">
          <nav className="mx-auto flex max-w-7xl gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {theme.navItems.map((item) => {
              const active = currentPath === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`block whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      active
                        ? "bg-white/[0.12] text-white"
                        : "border border-white/[0.08] bg-white/[0.04] text-gray-400 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-black/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
            <div>
              <SiteLogo href="/" size="sm" showText />
              <p className="mt-4 max-w-xs text-sm leading-6 text-gray-500">
                AI-powered interview practice for candidates and a structured
                AI assessment platform for hiring teams. Built in the UK.
              </p>
              <p className="mt-5 text-xs text-gray-600">
                © {new Date().getFullYear()} AI Career Mentor Ltd · England &amp; Wales
              </p>
            </div>

            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                {theme.eyebrow}
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                {theme.navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block transition hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                Account
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                <Link
                  href={theme.signInPath}
                  className="block transition hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href={theme.signUpPath}
                  className="block transition hover:text-white"
                >
                  {audience === "candidate" ? "Start free" : "Create workspace"}
                </Link>
                <Link
                  href={theme.switchAudienceHref}
                  className="block transition hover:text-white"
                >
                  {audience === "candidate"
                    ? "Hiring team site"
                    : "Candidate site"}
                </Link>
              </div>
            </div>

            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                Resources
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                <Link href="/blog" className="block transition hover:text-white">
                  Interview guides
                </Link>
                <Link href="/questions" className="block transition hover:text-white">
                  Question library
                </Link>
                <Link href="/tools/star-scorer" className="block transition hover:text-white">
                  Free STAR scorer
                </Link>
              </div>
            </div>

            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                Company
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                <Link href="/about" className="block transition hover:text-white">
                  About
                </Link>
                <Link href="/universities" className="block transition hover:text-white">
                  Universities
                </Link>
                <Link href="/security" className="block transition hover:text-white">
                  Security
                </Link>
                <Link href="/press" className="block transition hover:text-white">
                  Press
                </Link>
                <Link
                  href="/privacy"
                  className="block transition hover:text-white"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="block transition hover:text-white"
                >
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
