/**
 * Audience-aware marketing shell.
 *
 * Used by the post-split marketing pages — /for-candidates/* and
 * /for-business/*. Each audience gets:
 *   - a unified purple brand identity across audiences
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
import { SiteFooter } from "@/app/components/marketing/SiteFooter";
import { DataTrustStrip } from "@/app/components/DataTrustStrip";
import { TrialBadge } from "@/app/components/marketing/TrialBadge";

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

/** Resource links shown in the candidate shell. */
const CANDIDATE_RESOURCE_LINKS = [
  { href: "/for-candidates/about",        label: "About us" },
  { href: "/for-candidates/blog",         label: "Interview guides" },
  { href: "/for-candidates/questions",    label: "Question library" },
  { href: "/for-candidates/star-scorer",  label: "Free STAR scorer" },
];

/** Resource links shown in the business/hiring-team shell. */
const BUSINESS_RESOURCE_LINKS = [
  { href: "/for-business/about",        label: "About us" },
  { href: "/for-business/blog",         label: "Interview guides" },
  { href: "/for-business/questions",    label: "Question library" },
  { href: "/for-business/star-scorer",  label: "Free STAR scorer" },
];

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
    primaryGradient: "from-purple-500 via-fuchsia-500 to-blue-500",
    primaryShadow: "shadow-purple-900/40",
    accentBorder: "border-purple-300/20",
    accentTextSoft: "text-purple-300/90",
    accentTextStrong: "text-purple-100",
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
      {/* Data trust bar — top of every audience page */}
      <DataTrustStrip variant="topbar" />

      {/* Background atmosphere — tinted by audience */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.18] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.18] blur-[160px]" />
      </div>

      {/* Header */}
      <header className="relative z-50">
        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center px-4 pt-1.5 pb-6 sm:px-6 sm:pt-2 sm:pb-8 lg:px-10">
          {/* Logo + audience badge */}
          <Link
            href={audience === "candidate" ? "/for-candidates" : "/for-business"}
            className="relative z-10 flex shrink-0 items-center gap-3"
          >
            <SiteLogo href="" size="md" showText />
            <span
              className={`hidden rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] sm:inline-block lg:hidden ${theme.accentBorder} bg-white/[0.04] ${theme.accentTextStrong}`}
            >
              {theme.eyebrow}
            </span>
          </Link>

          {/* Desktop nav — centred in the grid column, lg+ (grid prevents overlap). */}
          <nav aria-label="Primary" className="hidden min-w-0 justify-center lg:flex">
            <div className="flex items-center gap-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] p-1.5">
              {theme.navItems.map((item) => {
                const active = currentPath === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={`block whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-bold transition lg:px-4 lg:text-[13.5px] ${
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
          <div className="relative z-10 flex shrink-0 items-center gap-2">
            <Link
              href={theme.signInPath}
              className="hidden whitespace-nowrap rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-[13px] font-bold text-white/80 transition hover:bg-white/[0.08] hover:text-white sm:block"
            >
              Sign in
            </Link>

            <Link
              href={theme.signUpPath}
              className={`whitespace-nowrap rounded-full bg-gradient-to-r ${theme.primaryGradient} px-4 py-2.5 text-[13px] font-black text-white shadow-lg ${theme.primaryShadow} transition hover:scale-[1.03] sm:px-5 lg:px-6`}
            >
              {audience === "candidate" ? "Start free" : "Get started"}
            </Link>
          </div>
        </div>

        {/* Mobile compact nav row — audience-only (shown below lg) */}
        <div className="px-4 py-2 sm:px-6 lg:hidden">
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
            {(audience === "candidate" || audience === "business") && (
              <>
                <span className="flex items-center text-white/[0.15]">·</span>
                {(audience === "candidate" ? CANDIDATE_RESOURCE_LINKS : BUSINESS_RESOURCE_LINKS).map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span className="block whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-xs font-bold text-gray-500 transition hover:bg-white/[0.07] hover:text-white">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </>
            )}
          </nav>
        </div>

        {/* Desktop resource links — secondary strip for both audiences (lg+) */}
        {(audience === "candidate" || audience === "business") && (
          <div className="hidden px-4 py-1.5 lg:block">
            <nav className="mx-auto flex max-w-7xl items-center justify-center gap-6">
              {(audience === "candidate" ? CANDIDATE_RESOURCE_LINKS : BUSINESS_RESOURCE_LINKS).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[12px] font-semibold text-gray-500 transition hover:text-gray-300"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Site-wide free-trial CTA (pricing and assessment-centre pages suppress it —
            assessment centre is Professional-only so the trial badge is misleading there) */}
        {!currentPath.endsWith("/pricing") && !currentPath.endsWith("/assessment-centre") && (
          <div className="flex justify-center px-4 pb-3 pt-1">
            <TrialBadge audience={audience} />
          </div>
        )}
      </header>

      {/* Content */}
      <main className="relative z-10">{children}</main>

      <SiteFooter />
    </div>
  );
}
