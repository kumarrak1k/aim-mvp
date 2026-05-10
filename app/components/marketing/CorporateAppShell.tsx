"use client";

/**
 * Authed corporate / hiring-team app shell.
 *
 * Used by /company/dashboard, /company/templates, /company/candidates,
 * /company/results, /company/setup. Cleanly separated from the candidate
 * area — no Practice / Progress / Profile links, no candidate marketing.
 *
 * Fuchsia/orange identity to distinguish from the purple candidate side.
 */

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useState, useEffect, type ReactNode } from "react";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

export type CorporateAppPath =
  | "/company/dashboard"
  | "/company/templates"
  | "/company/templates/new"
  | "/company/candidates"
  | "/company/results"
  | "/company/setup"
  | "/company/api-keys";

type CorporateAppShellProps = {
  children: ReactNode;
  currentPath: CorporateAppPath;
};

const navItems: Array<{ href: CorporateAppPath; label: string }> = [
  { href: "/company/dashboard", label: "Dashboard" },
  { href: "/company/templates", label: "Templates" },
  { href: "/company/candidates", label: "Candidates" },
  { href: "/company/results", label: "Results" },
];

export function CorporateAppShell({
  children,
  currentPath,
}: CorporateAppShellProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0614] text-white">
      {/* Background — fuchsia/purple business identity */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(232,80,180,0.18),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(120,60,255,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.18] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.15] blur-[160px]" />
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "border-b border-white/[0.07] bg-[#0d0520]/60 backdrop-blur-xl" : "border-b border-transparent bg-transparent"}`}>
        <div className="relative mx-auto flex w-full max-w-7xl items-center px-4 py-3 sm:px-6 lg:px-8 lg:py-3.5">
          <Link
            href="/company/dashboard"
            className="relative z-10 flex shrink-0 items-center gap-3"
          >
            <SiteLogo href="" size="md" showText />
            <span className="hidden rounded-full border border-fuchsia-300/20 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-100 sm:inline-block lg:hidden">
              Hiring team
            </span>
          </Link>

          {/* Desktop pill nav — absolutely centred so position never shifts */}
          <nav className="pointer-events-none absolute inset-x-0 hidden justify-center lg:flex">
            <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] p-1.5">
              {navItems.map((item) => {
                const active =
                  currentPath === item.href ||
                  (item.href === "/company/templates" &&
                    currentPath === "/company/templates/new");
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
          <div className="relative z-10 ml-auto flex shrink-0 items-center gap-2">
            {/* Send invite shortcut — hidden when already on candidates */}
            {currentPath !== "/company/candidates" &&
              currentPath !== "/company/setup" && (
                <Link href="/company/candidates" className="hidden sm:block">
                  <button className="whitespace-nowrap rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-2.5 text-[13px] font-black text-white shadow-lg shadow-fuchsia-950/40 transition hover:scale-[1.03] sm:px-5 xl:px-6">
                    Send invite
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
                (item.href === "/company/templates" &&
                  currentPath === "/company/templates/new");
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

      <main className="relative z-10 pb-20 sm:pb-0">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-black/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <SiteLogo href="/" size="sm" showText />
              <p className="mt-4 max-w-xs text-sm leading-6 text-gray-500">
                AI assessment platform for hiring teams. Built in the UK.
              </p>
              <p className="mt-5 text-xs text-gray-600">
                © {new Date().getFullYear()} AI Career Mentor Ltd · England &amp; Wales
              </p>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                Workspace
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                <Link
                  href="/company/dashboard"
                  className="block transition hover:text-white"
                >
                  Dashboard
                </Link>
                <Link
                  href="/company/templates"
                  className="block transition hover:text-white"
                >
                  Templates
                </Link>
                <Link
                  href="/company/candidates"
                  className="block transition hover:text-white"
                >
                  Candidates
                </Link>
                <Link
                  href="/company/results"
                  className="block transition hover:text-white"
                >
                  Results
                </Link>
              </div>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                Marketing
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                <Link
                  href="/for-business"
                  className="block transition hover:text-white"
                >
                  Hiring team site
                </Link>
                <Link
                  href="/for-business/assessment-platform"
                  className="block transition hover:text-white"
                >
                  Platform
                </Link>
                <Link
                  href="/for-business/pricing"
                  className="block transition hover:text-white"
                >
                  Pricing
                </Link>
              </div>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                Legal
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                <Link href="/privacy" className="block transition hover:text-white">
                  Privacy
                </Link>
                <Link href="/terms" className="block transition hover:text-white">
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.1] bg-[#080412]/96 backdrop-blur-2xl sm:hidden"
        aria-label="Hiring team navigation"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex h-[60px] items-stretch">
          <BottomNavItem
            href="/company/dashboard"
            label="Dashboard"
            active={currentPath === "/company/dashboard"}
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
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          </BottomNavItem>

          <BottomNavItem
            href="/company/templates"
            label="Templates"
            active={
              currentPath === "/company/templates" ||
              currentPath === "/company/templates/new"
            }
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
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <line x1="4" y1="10" x2="20" y2="10" />
            </svg>
          </BottomNavItem>

          <BottomNavItem
            href="/company/candidates"
            label="Invite"
            primary
            active={currentPath === "/company/candidates"}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </BottomNavItem>

          <BottomNavItem
            href="/company/results"
            label="Results"
            active={currentPath === "/company/results"}
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
              <line x1="3" y1="20" x2="3" y2="10" />
              <line x1="9" y1="20" x2="9" y2="4" />
              <line x1="15" y1="20" x2="15" y2="14" />
              <line x1="21" y1="20" x2="21" y2="8" />
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
              ? "bg-gradient-to-br from-fuchsia-400 to-purple-400 shadow-fuchsia-900/60"
              : "bg-gradient-to-br from-fuchsia-500 to-purple-500 shadow-fuchsia-900/40"
          }`}
        >
          <span className="text-white">{children}</span>
        </div>
        <span className="text-[9px] font-bold leading-none text-fuchsia-300">
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
