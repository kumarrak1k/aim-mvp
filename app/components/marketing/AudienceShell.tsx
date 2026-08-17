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
import { SkipToContent } from "@/app/components/SkipToContent";

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
  navItems: Array<{ href?: string; label: string; dropdown?: Array<{ href: string; label: string }> }>;
  primaryGradient: string;
  primaryShadow: string;
  accentBorder: string;
  accentTextSoft: string;
  accentTextStrong: string;
  switchAudienceLabel: string;
  switchAudienceHref: string;
};

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
      { href: "/", label: "Overview" },
      { href: "/about", label: "About us" },
      { href: "/interview-practice", label: "Interview practice" },
      { href: "/mock-assessment-centre", label: "Assessment centre" },
      { href: "/pricing", label: "Pricing" },
      {
        label: "Free tools",
        dropdown: [
          { href: "/blog", label: "Interview guides" },
          { href: "/questions", label: "Question library" },
          { href: "/tools/star-scorer", label: "Free STAR scorer" },
        ],
      },
    ],
    primaryGradient:
      "from-violet-600 to-purple-600",
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
    primaryGradient: "from-violet-600 to-purple-600",
    primaryShadow: "shadow-purple-900/40",
    accentBorder: "border-purple-300/20",
    accentTextSoft: "text-purple-300/90",
    accentTextStrong: "text-purple-100",
    switchAudienceLabel: "I'm a candidate →",
    switchAudienceHref: "/",
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
      <SkipToContent />
      {/* Data trust bar — top of every audience page */}
      <DataTrustStrip variant="topbar" />

      {/* Background atmosphere — tinted by audience */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.10),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.06),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.08] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.08] blur-[160px]" />
      </div>

      {/* Header */}
      <header className="relative z-50">
        <div className="relative mx-auto grid w-full max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] grid-cols-[auto_minmax(0,1fr)_auto] items-center px-4 pt-1.5 pb-3 sm:px-6 sm:pt-2 sm:pb-4 lg:px-10">
          {/* Logo + audience badge */}
          <Link
            href={audience === "candidate" ? "/" : "/for-business"}
            className="relative z-10 flex shrink-0 items-center gap-3"
          >
            <SiteLogo href="" size="md" showText />
            <span
              className={`hidden rounded-full border px-3 py-1 text-[12px] font-bold tracking-wide sm:inline-block xl:hidden ${theme.accentBorder} bg-white/[0.04] ${theme.accentTextStrong}`}
            >
              {theme.eyebrow}
            </span>
          </Link>

          {/* Desktop nav — centred in the grid column, lg+ (grid prevents overlap). */}
          <nav aria-label="Primary" className="hidden min-w-0 justify-center xl:flex">
            <div className="flex items-center gap-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] p-1.5">
              {theme.navItems.map((item) => {
                // "Free tools" — a hover/focus dropdown. CSS-only so this shell
                // stays a server component; focus-within keeps it keyboard
                // accessible, and the outer pt-2 is a transparent bridge so the
                // pointer can cross from trigger to menu without it closing.
                if (item.dropdown) {
                  return (
                    <div key={item.label} className="group/dd relative">
                      <button
                        type="button"
                        aria-haspopup="true"
                        className="flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-bold text-gray-400 transition group-hover/dd:bg-white/[0.07] group-hover/dd:text-white group-focus-within/dd:bg-white/[0.07] group-focus-within/dd:text-white xl:px-4 xl:text-[13.5px]"
                      >
                        {item.label}
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden className="transition group-hover/dd:rotate-180">
                          <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-2 opacity-0 transition group-hover/dd:visible group-hover/dd:opacity-100 group-focus-within/dd:visible group-focus-within/dd:opacity-100">
                        <div className="rounded-2xl border border-white/[0.09] bg-[#140a26] p-1.5 shadow-2xl shadow-black/50">
                          {item.dropdown.map((sub) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className="block whitespace-nowrap rounded-xl px-3.5 py-2 text-center text-[13px] font-semibold text-gray-300 transition hover:bg-white/[0.07] hover:text-white"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                const active = currentPath === item.href;
                return (
                  <Link key={item.href} href={item.href!}>
                    <span
                      className={`block whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-bold transition xl:px-4 xl:text-[13.5px] ${
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
          {/* justify-end because this row lives in the grid's 1fr column: it
              stretches to whatever the logo leaves behind. Without it the
              actions were only right-aligned by accident, because the old
              logo happened to be wide enough to squeeze the column shut. */}
          <div className="relative z-10 flex shrink-0 items-center justify-end gap-2">
            <Link
              href={theme.signInPath}
              className="hidden whitespace-nowrap rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-[13px] font-bold text-white/80 transition hover:bg-white/[0.08] hover:text-white sm:block"
            >
              Sign in
            </Link>

            <Link
              href={theme.signUpPath}
              className={`inline-flex min-w-0 items-center justify-center whitespace-normal rounded-full bg-gradient-to-r text-center leading-tight ${theme.primaryGradient} min-h-[44px] px-4 py-2.5 text-[13px] font-bold text-white shadow-lg ${theme.primaryShadow} transition hover:scale-[1.03] sm:whitespace-nowrap sm:px-5 lg:px-6`}
            >
              {audience === "candidate" ? "Start free" : "Get started"}
            </Link>
          </div>
        </div>

        {/* Mobile + tablet nav — a hamburger disclosure shown below lg. The
            old horizontal pill strip overflowed on phones and read as a
            cramped, not-obviously-scrollable row. This is CSS-only (native
            <details>) so the shell stays a server component: the <summary>
            toggles the panel, group-open rotates the chevron, and every
            destination is a full-width row that shows clearly. */}
        <details className="group/nav px-4 pb-3 sm:px-6 xl:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-white/[0.09] bg-white/[0.05] px-4 py-3 text-white [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2.5 text-sm font-bold">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Menu
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="text-gray-400 transition group-open/nav:rotate-180">
              <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>

          <div className="mt-2 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#140a26] p-2 shadow-2xl shadow-black/50">
            {theme.navItems.map((item) => {
              // The "Free tools" dropdown becomes a labelled group with its
              // children listed underneath — no hover needed on touch.
              if (item.dropdown) {
                return (
                  <div key={item.label} className="mt-1 border-t border-white/[0.06] pt-1">
                    <p className="px-4 pb-1 pt-2 text-[12px] font-bold tracking-wide text-gray-400">
                      {item.label}
                    </p>
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="block rounded-xl px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                );
              }
              const active = currentPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`block rounded-xl px-4 py-3 text-sm font-bold transition ${
                    active
                      ? "bg-white/[0.1] text-white"
                      : "text-gray-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {audience === "business" && (
              <div className="mt-1 border-t border-white/[0.06] pt-1">
                {BUSINESS_RESOURCE_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-gray-400 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Sign in — hidden in the top bar on phones (sm:block there), so
                surface it inside the menu on the smallest screens. */}
            <div className="mt-1 border-t border-white/[0.06] pt-1 sm:hidden">
              <Link
                href={theme.signInPath}
                className="block rounded-xl px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/[0.06] hover:text-white"
              >
                Sign in
              </Link>
            </div>
          </div>
        </details>

        {/* Desktop resource strip — business only now. The candidate header
            folds these into the primary nav (About us) and the "Free tools"
            dropdown, so the second row is gone. */}
        {audience === "business" && (
          <div className="hidden px-4 py-1.5 xl:block">
            <nav className="mx-auto flex max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] items-center justify-center gap-6">
              {BUSINESS_RESOURCE_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[12px] font-semibold text-gray-400 transition hover:text-gray-300"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}

      </header>

      {/* Content */}
      <main id="main-content" className="relative z-10">{children}</main>

      <SiteFooter />
    </div>
  );
}
