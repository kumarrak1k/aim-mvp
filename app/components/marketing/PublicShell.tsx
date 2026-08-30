/**
 * PublicShell — full-chrome marketing shell for all public pages that are
 * not audience-split (about, blog, press, compare, security, universities,
 * tools, question library).
 *
 * Provides:
 *   - Sticky nav with logo, universal links, and candidate CTAs
 *   - Responsive mobile nav strip
 *   - Multi-column footer
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { WhenSignedIn, WhenSignedOut } from "@/app/components/marketing/AuthAwareCta";
import { SiteLogo } from "@/app/components/brand/SiteLogo";
import { SiteFooter } from "@/app/components/marketing/SiteFooter";
import { DataTrustStrip } from "@/app/components/DataTrustStrip";
import { SkipToContent } from "@/app/components/SkipToContent";
import { TrialBadge } from "@/app/components/marketing/TrialBadge";

const NAV_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/blog", label: "Interview guides" },
  { href: "/questions", label: "Question library" },
  { href: "/tools/star-scorer", label: "Free STAR scorer" },
];

type PublicShellProps = {
  children: ReactNode;
  currentPath?: string;
};

export function PublicShell({ children, currentPath }: PublicShellProps) {
  return (
    <div className="relative min-h-screen bg-background text-white">
      <SkipToContent />
      {/* Data trust bar — top of every public page */}
      <DataTrustStrip variant="topbar" />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 page-glow" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.08] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.08] blur-[160px]" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-50">
        <div className="relative mx-auto grid w-full max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] grid-cols-[auto_minmax(0,1fr)_auto] items-center px-4 pt-1.5 pb-6 sm:px-6 sm:pt-2 sm:pb-8 lg:px-10">
          {/* Logo */}
          <div className="relative z-10">
            <SiteLogo href="/" size="md" showText />
          </div>

          {/* Desktop nav — absolutely page-centred at xl so it lines up with
              the page-centred trust strip above (the grid column's centre
              drifts left because the auth buttons outweigh the logo). */}
          <nav
            aria-label="Primary"
            className="hidden min-w-0 justify-center xl:absolute xl:left-1/2 xl:top-1/2 xl:flex xl:-translate-x-1/2 xl:-translate-y-1/2"
          >
            <div className="flex items-center gap-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] p-1">
              {NAV_LINKS.map((item) => {
                const active = currentPath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-bold transition ${
                      active
                        ? "bg-white/[0.12] text-white"
                        : "text-gray-400 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Phone-only compact CTA — the audience pills below need sm+, and
              without this the phone header has no action at all. */}
          <WhenSignedOut>
            <Link
              href="/for-candidates"
              className="col-start-3 relative z-10 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-bold text-on-accent shadow-lg shadow-purple-900/40 sm:hidden"
            >
              Start free
            </Link>
          </WhenSignedOut>
          <WhenSignedIn>
            <a
              href="/api/account/home"
              className="col-start-3 relative z-10 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-bold text-on-accent shadow-lg shadow-purple-900/40 sm:hidden"
            >
              My dashboard
            </a>
          </WhenSignedIn>

          {/* One audience.
              Was three pills — Candidates / Corporates / Universities — each
              with its own sign-in. The homepage lost these in 901c0c7, but this
              shell renders the header for /about and every other marketing
              page, so the corporate and university links survived there. Now a
              single Sign in / Start free pair, matching the homepage. */}
          <WhenSignedOut>
            <div className="col-start-3 relative z-10 hidden shrink-0 items-center gap-2 sm:flex">
              <Link
                href="/for-candidates/sign-in"
                className="rounded-full border border-purple-300/20 bg-purple-300/[0.07] px-4 py-2 text-xs font-bold text-purple-100 transition hover:bg-purple-300/[0.12]"
              >
                Sign in
              </Link>
              <Link
                href="/for-candidates/sign-up"
                className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-on-accent shadow-lg shadow-purple-900/30 transition hover:scale-[1.02]"
              >
                Start free
              </Link>
            </div>
          </WhenSignedOut>
          {/* Signed in: the marketing pills give way to one dashboard button
              (same slot, narrower than the pills, so no nav-oval overlap).
              Plain <a>: Link would prefetch the redirect route. */}
          <WhenSignedIn>
            <div className="col-start-3 relative z-10 hidden shrink-0 sm:flex">
              <a
                href="/api/account/home"
                className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-on-accent shadow-lg shadow-purple-900/30 transition hover:scale-[1.02]"
              >
                My dashboard
              </a>
            </div>
          </WhenSignedIn>
        </div>

        {/* Mobile / tablet scrollable nav strip (shown below xl) */}
        <div className="px-4 py-2 sm:px-6 xl:hidden">
          <nav className="mx-auto flex max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV_LINKS.map((item) => {
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

        {/* Site-wide free-trial CTA — suppressed on the universities page (B2B enquiry, not self-serve trial) */}
        {currentPath !== "/universities" && (
          <div className="flex justify-center px-4 pb-3 pt-1">
            <TrialBadge audience="candidate" />
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main id="main-content" className="relative z-10">{children}</main>

      <SiteFooter />
    </div>
  );
}
