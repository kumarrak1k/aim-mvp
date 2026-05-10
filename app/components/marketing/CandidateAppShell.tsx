"use client";

/**
 * Authed candidate app shell.
 *
 * Used by /practice, /progress, /profile (and any future candidate-only
 * authed pages). Cleanly separated from the corporate workspace — there
 * is no "Company" link, no recruiter nav, nothing that would confuse a
 * candidate who's just trying to practise interviews.
 *
 * The legacy MarketingShell mixed both audiences into one nav and is
 * being retired. Once /company/* is also migrated to CorporateAppShell,
 * MarketingShell can be deleted.
 */

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

export type CandidateAppPath =
  | "/practice"
  | "/practice/session"
  | "/progress"
  | "/profile";

type CandidateAppShellProps = {
  children: ReactNode;
  currentPath: CandidateAppPath;
};

const navItems: Array<{ href: CandidateAppPath; label: string }> = [
  { href: "/practice", label: "Practice" },
  { href: "/progress", label: "Progress" },
  { href: "/profile", label: "Profile" },
];

export function CandidateAppShell({
  children,
  currentPath,
}: CandidateAppShellProps) {
  return (
    <div className="relative min-h-screen bg-[#0a0614] text-white">
      {/* Background — purple/cyan candidate identity */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.18] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.18] blur-[160px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#0d0520]/50 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8 lg:py-3.5">
          {/* Logo + badge */}
          <Link href="/practice" className="flex shrink-0 items-center gap-3">
            <SiteLogo href="" size="md" showText />
            <span className="hidden rounded-full border border-purple-300/20 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-purple-100 sm:inline-block">
              Candidate
            </span>
          </Link>

          {/* Desktop pill nav (lg+) */}
          <nav className="hidden flex-1 lg:flex lg:justify-center">
            <div className="flex items-center gap-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] p-1.5">
              {navItems.map((item) => {
                const active =
                  currentPath === item.href ||
                  (item.href === "/practice" &&
                    currentPath === "/practice/session");
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

          {/* Right actions */}
          <div className="ml-auto mr-2 flex shrink-0 items-center gap-2 sm:mr-3 lg:mr-4">
            {/* Start Practising shortcut — hidden when already on practice */}
            {currentPath !== "/practice" &&
              currentPath !== "/practice/session" && (
                <Link href="/practice" className="hidden sm:block">
                  <button className="whitespace-nowrap rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-4 py-2.5 text-[13px] font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.03] sm:px-5 xl:px-6">
                    Start Practising
                  </button>
                </Link>
              )}

            <div className="shrink-0 px-2">
              <UserButton />
            </div>
          </div>
        </div>

        {/* Tablet/mobile compact nav row */}
        <div className="border-t border-white/[0.05] px-4 py-2 sm:px-6 lg:hidden">
          <nav className="mx-auto flex max-w-7xl gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => {
              const active =
                currentPath === item.href ||
                (item.href === "/practice" &&
                  currentPath === "/practice/session");
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

      {/* Main content — pb-20 on mobile leaves room for the bottom nav */}
      <main className="relative z-10 pb-20 sm:pb-0">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-black/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <SiteLogo href="/" size="sm" showText />
              <p className="mt-4 max-w-xs text-sm leading-6 text-gray-500">
                AI-powered interview practice and assessment-centre coaching.
                Built in the UK.
              </p>
              <p className="mt-5 text-xs text-gray-600">
                © {new Date().getFullYear()} AI Career Mentor Ltd · England &amp; Wales
              </p>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                Candidate
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                <Link href="/practice" className="block transition hover:text-white">
                  Practice
                </Link>
                <Link href="/progress" className="block transition hover:text-white">
                  Progress
                </Link>
                <Link href="/profile" className="block transition hover:text-white">
                  Profile
                </Link>
              </div>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                Marketing
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                <Link
                  href="/for-candidates"
                  className="block transition hover:text-white"
                >
                  Candidate site
                </Link>
                <Link
                  href="/for-candidates/pricing"
                  className="block transition hover:text-white"
                >
                  Pricing
                </Link>
                <Link
                  href="/for-candidates/assessment-centre"
                  className="block transition hover:text-white"
                >
                  Assessment centre
                </Link>
              </div>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                Legal
              </p>
              <div className="space-y-3 text-sm text-gray-400">
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

      {/* Mobile bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.1] bg-[#080412]/96 backdrop-blur-2xl sm:hidden"
        aria-label="Candidate navigation"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex h-[60px] items-stretch">
          <BottomNavItem
            href="/practice"
            label="Practice"
            primary
            active={
              currentPath === "/practice" || currentPath === "/practice/session"
            }
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          </BottomNavItem>

          <BottomNavItem
            href="/progress"
            label="Progress"
            active={currentPath === "/progress"}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </BottomNavItem>

          <BottomNavItem
            href="/profile"
            label="Profile"
            active={currentPath === "/profile"}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </BottomNavItem>
        </div>
      </nav>
    </div>
  );
}

function BottomNavItem({
  href,
  label,
  active,
  primary = false,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  primary?: boolean;
  children: ReactNode;
}) {
  if (primary) {
    return (
      <Link
        href={href}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-opacity active:opacity-70"
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 ${
            active
              ? "bg-gradient-to-br from-purple-400 via-fuchsia-400 to-blue-400 shadow-purple-900/60"
              : "bg-gradient-to-br from-purple-500 via-fuchsia-500 to-blue-500 shadow-purple-900/40"
          }`}
        >
          <span className="text-white">{children}</span>
        </div>
        <span className="text-[9px] font-bold leading-none text-purple-300">
          {label}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-opacity active:opacity-60"
    >
      <span
        className={`transition-colors ${active ? "text-white" : "text-gray-500"}`}
      >
        {children}
      </span>
      <span
        className={`text-[9px] font-bold leading-none transition-colors ${
          active ? "text-white" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
