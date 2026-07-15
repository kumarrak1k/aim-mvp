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
    <div className="relative min-h-screen bg-[#0a0614] text-white">
      {/* Data trust bar — top of every public page */}
      <DataTrustStrip variant="topbar" />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.18] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.18] blur-[160px]" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-50">
        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center px-4 pt-1.5 pb-6 sm:px-6 sm:pt-2 sm:pb-8 lg:px-10">
          {/* Logo */}
          <div className="relative z-10">
            <SiteLogo href="/" size="md" showText />
          </div>

          {/* Desktop nav — centred in grid column; lg+ only (grid prevents overlap). */}
          <nav aria-label="Primary" className="hidden min-w-0 justify-center lg:flex">
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
              className="col-start-3 relative z-10 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-purple-900/40 sm:hidden"
            >
              Start free
            </Link>
          </WhenSignedOut>
          <WhenSignedIn>
            <a
              href="/api/account/home"
              className="col-start-3 relative z-10 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-purple-900/40 sm:hidden"
            >
              My dashboard
            </a>
          </WhenSignedIn>

          {/* Audience buttons — matches homepage; signed-out visitors also get a
              per-audience Sign in, signed-in users a single "My dashboard". */}
          <div className="col-start-3 relative z-10 hidden shrink-0 items-start gap-2 sm:flex">
            <div className="flex flex-col items-center gap-1.5">
              <Link
                href="/for-candidates"
                className="rounded-full border border-purple-300/20 bg-purple-300/[0.07] px-4 py-2 text-xs font-black text-purple-100 transition hover:bg-purple-300/[0.12]"
              >
                Candidates
              </Link>
              <WhenSignedOut>
                <Link
                  href="/for-candidates/sign-in"
                  className="rounded-full bg-violet-600 px-4 py-1 text-[11px] font-black text-white transition hover:bg-violet-500"
                >
                  Sign in
                </Link>
              </WhenSignedOut>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Link
                href="/for-business"
                className="rounded-full border border-purple-300/20 bg-purple-300/[0.07] px-4 py-2 text-xs font-black text-purple-100 transition hover:bg-purple-300/[0.12]"
              >
                Corporates
              </Link>
              <WhenSignedOut>
                <Link
                  href="/for-business/sign-in"
                  className="rounded-full bg-fuchsia-600 px-4 py-1 text-[11px] font-black text-white transition hover:bg-fuchsia-500"
                >
                  Sign in
                </Link>
              </WhenSignedOut>
            </div>
            <Link
              href="/universities"
              className="rounded-full border border-purple-300/20 bg-purple-300/[0.07] px-4 py-2 text-xs font-black text-purple-100 transition hover:bg-purple-300/[0.12]"
            >
              Universities
            </Link>
            <WhenSignedIn>
              {/* Plain <a>: Next's Link would prefetch the redirect route */}
              <a
                href="/api/account/home"
                className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-purple-900/30 transition hover:opacity-90"
              >
                My dashboard
              </a>
            </WhenSignedIn>
          </div>
        </div>

        {/* Mobile / tablet scrollable nav strip (shown below lg) */}
        <div className="px-4 py-2 sm:px-6 lg:hidden">
          <nav className="mx-auto flex max-w-7xl gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      <main className="relative z-10">{children}</main>

      <SiteFooter />
    </div>
  );
}
