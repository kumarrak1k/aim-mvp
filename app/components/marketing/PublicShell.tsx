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
        <div className="relative mx-auto flex w-full max-w-7xl items-center px-4 pt-1.5 pb-6 sm:px-6 sm:pt-2 sm:pb-8 lg:px-10">
          {/* Logo */}
          <div className="relative z-10">
            <SiteLogo href="/" size="md" showText />
          </div>

          {/* Desktop nav — absolutely centred pill. xl+ only: below that the
              absolute pill would overlap the audience buttons on tablets. */}
          <nav aria-label="Primary" className="pointer-events-none absolute inset-x-0 hidden justify-center xl:flex">
            <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] p-1">
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

          {/* Audience buttons — matches homepage */}
          <div className="relative z-10 ml-auto hidden shrink-0 items-center gap-2 sm:flex">
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
            <Link
              href="/universities"
              className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/[0.12]"
            >
              Universities
            </Link>
          </div>
        </div>

        {/* Mobile / tablet scrollable nav strip (shown below xl) */}
        <div className="px-4 py-2 sm:px-6 xl:hidden">
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

        {/* Site-wide free-trial CTA */}
        <div className="flex justify-center px-4 pb-3 pt-1">
          <TrialBadge audience="candidate" />
        </div>
      </header>

      {/* ── Content ── */}
      <main className="relative z-10">{children}</main>

      <SiteFooter />
    </div>
  );
}
