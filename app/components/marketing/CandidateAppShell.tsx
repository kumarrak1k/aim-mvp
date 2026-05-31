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
import { type ReactNode } from "react";
import { SiteLogo } from "@/app/components/brand/SiteLogo";
import { SiteFooter } from "@/app/components/marketing/SiteFooter";
import { PlanPage } from "@/app/components/account/PlanPage";
import { TrialBanner } from "@/app/components/account/TrialBanner";

export type CandidateAppPath =
  | "/practice"
  | "/practice/session"
  | "/progress"
  | "/profile"
  | "/assessment-centre"
  | "/career-docs"
  | "/career-docs/cv-enhancer"
  | "/career-docs/cover-letter"
  | "/career-docs/personal-statement"
  // Resource pages — visible in the secondary strip, not the main nav
  | "/for-candidates"
  | "/for-candidates/about"
  | "/for-candidates/blog"
  | "/for-candidates/questions"
  | "/for-candidates/star-scorer"
  // Marketing sub-pages — shown in the audience nav
  | "/for-candidates/interview-practice"
  | "/for-candidates/assessment-centre"
  | "/for-candidates/pricing";

type CandidateAppShellProps = {
  children: ReactNode;
  currentPath: CandidateAppPath;
};

const navItems: Array<{ href: CandidateAppPath; label: string }> = [
  { href: "/profile",           label: "My Profile"          },
  { href: "/practice",          label: "Interview Practice"  },
  { href: "/assessment-centre", label: "Assessment Centre"   },
  { href: "/career-docs",       label: "Career Docs"         },
  { href: "/progress",          label: "My Progress"         },
];

const resourceLinks = [
  { href: "/for-candidates/about",        label: "About us"          },
  { href: "/for-candidates/blog",         label: "Interview guides"  },
  { href: "/for-candidates/questions",    label: "Question library"  },
  { href: "/for-candidates/star-scorer",  label: "Free STAR scorer" },
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
      <header className="sticky top-0 z-50 backdrop-blur-2xl">
        <div className="relative mx-auto flex w-full max-w-7xl items-center px-4 py-3 sm:px-6 lg:px-8 lg:py-3.5">
          {/* Logo + badge */}
          <Link href="/practice" className="relative z-10 flex shrink-0 items-center gap-3">
            <SiteLogo href="" size="md" showText />
            <span className="hidden rounded-full border border-purple-300/20 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-purple-100 sm:inline-block lg:hidden">
              Candidate
            </span>
          </Link>

          {/* Desktop pill nav — absolutely centred so position never shifts */}
          <nav aria-label="Primary" className="pointer-events-none absolute inset-x-0 hidden justify-center lg:flex">
            <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] p-1.5">
              {navItems.map((item) => {
                const active =
                  currentPath === item.href ||
                  (item.href === "/practice" && currentPath === "/practice/session") ||
                  (item.href === "/career-docs" && currentPath.startsWith("/career-docs/"));
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
              <UserButton>
                <UserButton.UserProfilePage
                  label="My Plan"
                  url="plan"
                  labelIcon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1em", height: "1em" }}>
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  }
                >
                  <PlanPage />
                </UserButton.UserProfilePage>
              </UserButton>
            </div>
          </div>
        </div>

        {/* Tablet/mobile compact nav row */}
        <div className="px-4 py-2 sm:px-6 lg:hidden">
          <nav className="mx-auto flex max-w-7xl gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => {
              const active =
                currentPath === item.href ||
                (item.href === "/practice" && currentPath === "/practice/session") ||
                (item.href === "/career-docs" && currentPath.startsWith("/career-docs/"));
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
            <span className="flex items-center text-white/[0.15]">·</span>
            {resourceLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                <span className="block whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-xs font-bold text-gray-500 transition hover:bg-white/[0.07] hover:text-white">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop resource links — secondary strip */}
        <div className="hidden px-4 py-1.5 lg:block">
          <nav className="mx-auto flex max-w-7xl items-center justify-center gap-6">
            {resourceLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[11px] font-semibold text-gray-500 transition hover:text-gray-300"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Reverse-trial countdown / start / upgrade bar */}
      <TrialBanner />

      {/* Main content — pb-20 on mobile leaves room for the bottom nav */}
      <main className="relative z-10 pb-20 sm:pb-0">{children}</main>

      <SiteFooter />

      {/* Mobile bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.1] bg-[#080412]/96 backdrop-blur-2xl sm:hidden"
        aria-label="Candidate navigation"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex h-[60px] items-stretch">
          <BottomNavItem href="/profile" label="Profile" active={currentPath === "/profile"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </BottomNavItem>

          <BottomNavItem href="/practice" label="Practice" active={currentPath === "/practice" || currentPath === "/practice/session"}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          </BottomNavItem>

          <BottomNavItem href="/assessment-centre" label="Assessment" primary primaryColor="cyan" active={currentPath === "/assessment-centre"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12h6M9 16h4" />
            </svg>
          </BottomNavItem>

          <BottomNavItem href="/career-docs" label="Docs"
            active={currentPath === "/career-docs" || currentPath.startsWith("/career-docs/")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </BottomNavItem>

          <BottomNavItem href="/progress" label="Progress" active={currentPath === "/progress"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
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
  primaryColor = "purple",
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  primary?: boolean;
  primaryColor?: "purple" | "cyan";
  children: ReactNode;
}) {
  if (primary) {
    const gradient =
      primaryColor === "cyan"
        ? active
          ? "bg-gradient-to-br from-cyan-400 via-purple-400 to-fuchsia-400 shadow-cyan-900/60"
          : "bg-gradient-to-br from-cyan-500 via-purple-500 to-fuchsia-500 shadow-cyan-900/40"
        : active
          ? "bg-gradient-to-br from-purple-400 via-fuchsia-400 to-blue-400 shadow-purple-900/60"
          : "bg-gradient-to-br from-purple-500 via-fuchsia-500 to-blue-500 shadow-purple-900/40";

    const labelColor = primaryColor === "cyan" ? "text-cyan-300" : "text-purple-300";

    return (
      <Link
        href={href}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-opacity active:opacity-70"
      >
        <div className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 ${gradient}`}>
          <span className="text-white">{children}</span>
        </div>
        <span className={`text-[9px] font-bold leading-none ${labelColor}`}>
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
      <span className={`transition-colors ${active ? "text-white" : "text-gray-500"}`}>
        {children}
      </span>
      <span className={`text-[9px] font-bold leading-none transition-colors ${active ? "text-white" : "text-gray-500"}`}>
        {label}
      </span>
    </Link>
  );
}
