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
import { useEffect, useState, type ReactNode } from "react";
import { SiteLogo } from "@/app/components/brand/SiteLogo";
import { DataTrustStrip } from "@/app/components/DataTrustStrip";
import { SiteFooter } from "@/app/components/marketing/SiteFooter";
import { PlanPage } from "@/app/components/account/PlanPage";
import { TrialBanner } from "@/app/components/account/TrialBanner";

export type CandidateAppPath =
  | "/practice"
  | "/practice/session"
  | "/progress"
  | "/profile"
  | "/guide"
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
  | "/interview-practice"
  | "/mock-assessment-centre"
  | "/pricing";

type CandidateAppShellProps = {
  children: ReactNode;
  // Accept any path: marketing pages routed through CandidateShell pass
  // their own path (/blog, /about, …), which the CandidateAppPath union
  // deliberately doesn't enumerate. Highlighting is string-compared below,
  // so a non-nav path simply highlights nothing.
  currentPath: CandidateAppPath | (string & {});
};

/**
 * `proOnly` marks the two Professional-tier features. Without a marker in the
 * nav they look identical to the included ones, so a Free or trial user picks
 * one and lands on an upgrade wall — which reads as bait-and-switch during a
 * three-day trial. The badge sets the expectation up front instead.
 */
const navItems: Array<{
  href?: CandidateAppPath;
  label: string;
  proOnly?: boolean;
  dropdown?: Array<{ href: string; label: string }>;
}> = [
  { href: "/profile",           label: "My Profile"          },
  { href: "/practice",          label: "Interview Practice"  },
  { href: "/assessment-centre", label: "Assessment Centre",  proOnly: true },
  { href: "/career-docs",       label: "CV Studio",          proOnly: true },
  { href: "/progress",          label: "My Progress"         },
  {
    label: "Free tools",
    dropdown: [
      { href: "/blog", label: "Interview guides" },
      { href: "/questions", label: "Question library" },
      { href: "/tools/star-scorer", label: "Free STAR scorer" },
    ],
  },
  { href: "/guide",             label: "User Guide"          },
];

/** Small "Pro" pill shown beside Professional-only nav items. */
function ProBadge() {
  return (
    <span
      aria-label="Professional plan required"
      className="ml-1.5 inline-block rounded-full border border-amber-400/30 bg-amber-400/[0.12] px-1.5 py-px align-middle text-[9px] font-bold tracking-wide text-amber-300"
    >
      Pro
    </span>
  );
}

export function CandidateAppShell({
  children,
  currentPath,
}: CandidateAppShellProps) {
  // New-user guide banner on the practice page. Starts hidden (SSR-safe),
  // shows after mount unless previously dismissed; dismissal persists.
  const [showGuideBanner, setShowGuideBanner] = useState(false);
  useEffect(() => {
    if (currentPath !== "/practice") return;
    try {
      setShowGuideBanner(localStorage.getItem("aim_guide_banner_dismissed") !== "1");
    } catch {
      // Storage unavailable — keep the banner hidden rather than nag forever.
    }
  }, [currentPath]);
  function dismissGuideBanner() {
    setShowGuideBanner(false);
    try {
      localStorage.setItem("aim_guide_banner_dismissed", "1");
    } catch {
      // Best effort.
    }
  }

  // null = plan not yet known. Badges stay hidden until we confirm the user
  // is NOT professional, so a Pro/comp user never sees a badge appear and
  // disappear (the flash), and the centred nav does not jump.
  const [isProfessional, setIsProfessional] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((data: { planName?: string; isActive?: boolean }) => {
        if (!cancelled) {
          setIsProfessional(data?.planName === "Professional" && !!data.isActive);
        }
      })
      .catch(() => {
        // Plan unknown on error — badges stay hidden (see the note above),
        // which fails closed to a clean nav rather than a flash.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0614] text-white">
      {/* Background — purple/cyan candidate identity */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.10),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.06),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.08] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.08] blur-[160px]" />
      </div>

      {/* Data trust bar — same messages as the signed-out pages */}
      <DataTrustStrip variant="topbar" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl">
        {/* Grid so the centred nav lives in its own column and cannot paint over
            the logo — the old flex + absolute layout let the pill nav overlap
            "AI Career Mentor" once it grew. */}
        <div className="relative mx-auto grid w-full max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 sm:px-6 lg:px-8 lg:py-3.5">
          {/* Logo + badge */}
          <Link href="/" className="relative z-10 flex shrink-0 items-center gap-3">
            <SiteLogo href="" size="md" showText />
            <span className="hidden rounded-full border border-purple-300/20 bg-white/[0.04] px-3 py-1 text-[10px] font-bold tracking-wide text-purple-100 sm:inline-block xl:hidden">
              Candidate
            </span>
          </Link>

          {/* Desktop pill nav */}
          <nav aria-label="Primary" className="hidden min-w-0 justify-center xl:flex">
            <div className="flex items-center gap-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] p-1.5">
              {navItems.map((item) => {
                if (item.dropdown) {
                  return (
                    <div key={item.label} className="group/dd relative">
                      <button
                        type="button"
                        aria-haspopup="true"
                        className="flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-[12.5px] font-bold text-gray-400 transition group-hover/dd:bg-white/[0.07] group-hover/dd:text-white group-focus-within/dd:bg-white/[0.07] group-focus-within/dd:text-white xl:px-4 xl:text-[13px]"
                      >
                        {item.label}
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden className="transition group-hover/dd:rotate-180">
                          <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-2 opacity-0 transition group-hover/dd:visible group-hover/dd:opacity-100 group-focus-within/dd:visible group-focus-within/dd:opacity-100">
                        <div className="rounded-2xl border border-white/[0.09] bg-[#140a26] p-1.5 shadow-2xl shadow-black/50">
                          {item.dropdown.map((sub) => (
                            <Link key={sub.href} href={sub.href} className="block whitespace-nowrap rounded-xl px-3.5 py-2 text-center text-[13px] font-semibold text-gray-300 transition hover:bg-white/[0.07] hover:text-white">
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                const active =
                  currentPath === item.href ||
                  (item.href === "/practice" && currentPath === "/practice/session") ||
                  (item.href === "/career-docs" && currentPath.startsWith("/career-docs/"));
                return (
                  <Link key={item.href} href={item.href!}>
                    <span
                      className={`block whitespace-nowrap rounded-full px-3 py-2 text-[12.5px] font-bold transition xl:px-4 xl:text-[13px] ${
                        active
                          ? "bg-white/[0.12] text-white shadow-sm"
                          : "text-gray-400 hover:bg-white/[0.07] hover:text-white"
                      }`}
                    >
                      {item.label}
                      {item.proOnly && isProfessional === false && <ProBadge />}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right actions — avatar only; Start Practising moved to its own row. */}
          <div className="relative z-10 flex shrink-0 items-center justify-end gap-2">
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

        {/* Tablet/mobile nav — the same hamburger disclosure the signed-out
            shell uses, so the site behaves identically either side of sign-in.
            Replaces both a horizontally-scrolling strip (whose overflow was
            invisible) and a fixed bottom bar (whose last item sat under the
            floating chat button). */}
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
            {navItems.map((item) => {
              if (item.dropdown) {
                return (
                  <div key={item.label} className="mt-1 border-t border-white/[0.06] pt-1">
                    <p className="px-4 pb-1 pt-2 text-[10px] font-bold tracking-wide text-gray-500">
                      {item.label}
                    </p>
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        SUB{item.label}
                      </Link>
                    ))}
                  </div>
                );
              }
              const href = item.href as string;
              const active =
                currentPath === href ||
                (href === "/practice" && currentPath === "/practice/session") ||
                (href === "/career-docs" && currentPath.startsWith("/career-docs/"));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`block rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    active
                      ? "bg-white/[0.1] text-white"
                      : "text-gray-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {item.label}
                  {item.proOnly && isProfessional === false && <ProBadge />}
                </Link>
              );
            })}
          </div>
        </details>

        {/* Start Practising — its own centred row, where the resource strip used
            to be. Hidden on the pages it points at. */}
        {currentPath !== "/practice" &&
          currentPath !== "/practice/session" &&
          currentPath !== "/assessment-centre" && (
            <div className="flex justify-center px-4 pb-2.5 pt-0.5">
              <Link
                href="/practice"
                className="whitespace-nowrap rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.03]"
              >
                Start Practising
              </Link>
            </div>
          )}
      </header>

      {/* New-user guide banner — practice page only, dismissible */}
      {showGuideBanner && (
        <div className="relative z-40 px-4 pt-2 sm:px-6">
          <div className="mx-auto flex max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] items-center justify-between gap-3 rounded-2xl border border-purple-400/30 bg-gradient-to-r from-purple-600/[0.22] via-fuchsia-600/[0.14] to-purple-600/[0.10] px-4 py-3 backdrop-blur-xl sm:px-5">
            <p className="text-[13px] font-bold leading-5 text-purple-50">
              <span className="mr-1.5" aria-hidden>📘</span>
              New here? Learn the platform in six quick steps.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/guide"
                className="whitespace-nowrap rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-1.5 text-[12px] font-bold text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.03]"
              >
                Open the guide →
              </Link>
              <button
                type="button"
                onClick={dismissGuideBanner}
                aria-label="Dismiss the guide banner"
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reverse-trial countdown / start / upgrade bar */}
      <TrialBanner />

      <main className="relative z-10">{children}</main>

      <SiteFooter />

    </div>
  );
}
