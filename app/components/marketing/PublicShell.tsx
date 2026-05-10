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

const NAV_LINKS = [
  { href: "/blog", label: "Interview guides" },
  { href: "/questions", label: "Question library" },
  { href: "/tools/star-scorer", label: "Free STAR scorer" },
  { href: "/for-candidates", label: "For candidates" },
  { href: "/for-business", label: "For teams" },
  { href: "/about", label: "About" },
];

type PublicShellProps = {
  children: ReactNode;
  currentPath?: string;
};

export function PublicShell({ children, currentPath }: PublicShellProps) {
  return (
    <div className="relative min-h-screen bg-[#0a0614] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,60,255,0.13),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-purple-600/[0.10] blur-[160px]" />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0a0614]/90 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8 lg:py-3.5">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <SiteLogo href="" size="md" showText />
          </Link>

          {/* Desktop nav — centred pill */}
          <nav className="hidden flex-1 items-center justify-center lg:flex">
            <div className="flex items-center gap-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] p-1.5">
              {NAV_LINKS.map((item) => {
                const active = currentPath === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={`block whitespace-nowrap rounded-full px-3.5 py-2 text-[12.5px] font-bold transition xl:px-4 xl:text-[13px] ${
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

          {/* Right CTAs */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link href="/for-candidates/sign-in">
              <button className="hidden whitespace-nowrap rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-[13px] font-bold text-white/80 transition hover:bg-white/[0.08] hover:text-white sm:block">
                Sign in
              </button>
            </Link>
            <Link href="/for-candidates/sign-up">
              <button className="whitespace-nowrap rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-4 py-2.5 text-[13px] font-black text-white shadow-lg shadow-purple-900/40 transition hover:scale-[1.03] sm:px-5">
                Start free
              </button>
            </Link>
          </div>
        </div>

        {/* Mobile / tablet scrollable nav strip */}
        <div className="border-t border-white/[0.05] px-4 py-2 sm:px-6 lg:hidden">
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
      </header>

      {/* ── Content ── */}
      <main className="relative z-10">{children}</main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-black/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div>
              <SiteLogo href="/" size="sm" showText />
              <p className="mt-4 max-w-xs text-sm leading-6 text-gray-500">
                AI-powered interview coaching for candidates, hiring teams, and
                university careers services. Built in the UK.
              </p>
              <p className="mt-5 text-xs text-gray-600">
                © {new Date().getFullYear()} AI Career Mentor Ltd · England &amp; Wales
              </p>
            </div>

            {/* For candidates */}
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                For candidates
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                <Link href="/for-candidates" className="block transition hover:text-white">Overview</Link>
                <Link href="/for-candidates/interview-practice" className="block transition hover:text-white">Interview practice</Link>
                <Link href="/for-candidates/assessment-centre" className="block transition hover:text-white">Assessment centre</Link>
                <Link href="/for-candidates/pricing" className="block transition hover:text-white">Pricing</Link>
                <Link href="/for-candidates/sign-up" className="block transition hover:text-white">Start free</Link>
              </div>
            </div>

            {/* Resources */}
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                Free resources
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                <Link href="/blog" className="block transition hover:text-white">Interview guides</Link>
                <Link href="/questions" className="block transition hover:text-white">Question library</Link>
                <Link href="/tools/star-scorer" className="block transition hover:text-white">STAR scorer</Link>
                <Link href="/for-business" className="block transition hover:text-white">For hiring teams</Link>
                <Link href="/universities" className="block transition hover:text-white">Universities</Link>
              </div>
            </div>

            {/* Company */}
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                Company
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                <Link href="/about" className="block transition hover:text-white">About</Link>
                <Link href="/press" className="block transition hover:text-white">Press</Link>
                <Link href="/security" className="block transition hover:text-white">Security</Link>
                <Link href="/privacy" className="block transition hover:text-white">Privacy</Link>
                <Link href="/terms" className="block transition hover:text-white">Terms</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
