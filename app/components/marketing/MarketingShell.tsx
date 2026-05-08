"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

export type MarketingPath =
  | "/"
  | "/platform"
  | "/how-it-works"
  | "/candidates"
  | "/pricing"
  | "/practice"
  | "/progress"
  | "/profile"
  | "/company/dashboard"
  | "/company/templates"
  | "/company/candidates"
  | "/enterprise";

type MarketingShellProps = {
  children: ReactNode;
  currentPath: MarketingPath;
};

type PageLinkCardProps = {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
};

const navItems: Array<{ href: MarketingPath; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/platform", label: "Platform" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/candidates", label: "Candidates" },
  { href: "/pricing", label: "Pricing" },
];

const tabletNavItems: Array<{ href: MarketingPath; label: string; color?: string }> = [
  { href: "/", label: "Home" },
  { href: "/platform", label: "Platform" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/candidates", label: "Candidates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/enterprise", label: "Enterprise" },
  { href: "/company/dashboard", label: "Company", color: "fuchsia" },
  { href: "/progress", label: "Progress", color: "cyan" },
  { href: "/profile", label: "Profile", color: "purple" },
];

function tabletNavClass(active: boolean, color?: string): string {
  if (active) {
    if (color === "fuchsia") return "border border-fuchsia-300/35 bg-fuchsia-300/15 text-fuchsia-50";
    if (color === "cyan") return "border border-cyan-300/30 bg-cyan-300/15 text-cyan-50";
    if (color === "purple") return "border border-purple-300/30 bg-purple-300/15 text-purple-50";
    return "bg-white/[0.12] text-white";
  }
  if (color === "fuchsia") return "border border-fuchsia-300/15 bg-fuchsia-300/[0.07] text-fuchsia-200 hover:bg-fuchsia-300/12";
  if (color === "cyan") return "border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200 hover:bg-cyan-300/12";
  if (color === "purple") return "border border-white/[0.08] bg-white/[0.04] text-purple-200/80 hover:bg-white/[0.07]";
  return "border border-white/[0.08] bg-white/[0.04] text-gray-400 hover:bg-white/[0.07] hover:text-white";
}

function isCompanyPath(path: MarketingPath): boolean {
  return (
    path === "/company/dashboard" ||
    path === "/company/templates" ||
    path === "/company/candidates"
  );
}

export function MarketingShell({ children, currentPath }: MarketingShellProps) {
  return (
    /* Root div — NO overflow-hidden so Clerk UserButton popup is never clipped */
    <div className="relative min-h-screen bg-[#0f0a1a] text-white">

      {/* Background atmosphere — self-contained fixed overlay so it never causes layout overflow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,60,255,0.22),transparent),radial-gradient(ellipse_50%_40%_at_85%_20%,rgba(34,211,238,0.07),transparent),linear-gradient(180deg,#0f0a1a_0%,#130e20_50%,#161228_100%)]" />
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-purple-600/[0.15] blur-[160px]" />
        <div className="absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-cyan-400/[0.07] blur-[130px]" />
        <div className="absolute -left-40 bottom-10 h-[400px] w-[400px] rounded-full bg-fuchsia-500/[0.09] blur-[130px]" />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0f0a1a]/90 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8 lg:py-3.5">

          {/* Logo */}
          <div className="shrink-0">
            <SiteLogo href="/" size="md" showText />
          </div>

          {/* Desktop pill nav (lg+) */}
          <nav className="hidden shrink-0 lg:flex">
            <div className="flex items-center gap-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] p-1.5">
              {navItems.map((item) => {
                const active = currentPath === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={`block whitespace-nowrap rounded-full px-3 py-2 text-[12.5px] font-bold transition xl:px-4 xl:text-[13px] 2xl:text-sm ${
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
              <Show when="signed-in">
                <Link href="/company/dashboard">
                  <span
                    className={`block whitespace-nowrap rounded-full px-3 py-2 text-[12.5px] font-bold transition xl:px-4 xl:text-[13px] 2xl:text-sm ${
                      isCompanyPath(currentPath)
                        ? "bg-fuchsia-400/20 text-fuchsia-100 shadow-sm"
                        : "text-fuchsia-300/70 hover:bg-fuchsia-400/10 hover:text-fuchsia-200"
                    }`}
                  >
                    Company
                  </span>
                </Link>
              </Show>
            </div>
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Show when="signed-in">
              <Link href="/progress">
                <button
                  className={`hidden whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-bold transition xl:block ${
                    currentPath === "/progress"
                      ? "border border-cyan-300/30 bg-cyan-300/12 text-cyan-50"
                      : "border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200/80 hover:bg-cyan-300/12 hover:text-cyan-100"
                  }`}
                >
                  Progress
                </button>
              </Link>
              <Link href="/profile">
                <button
                  className={`hidden whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-bold transition xl:block ${
                    currentPath === "/profile"
                      ? "border border-purple-300/30 bg-purple-300/12 text-purple-50"
                      : "border border-white/[0.1] bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  Profile
                </button>
              </Link>
            </Show>

            {/* "Start Practising" — hidden on mobile (bottom nav handles it), visible sm+ */}
            <Link href="/practice" className="hidden sm:block">
              <button className="whitespace-nowrap rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-4 py-2.5 text-[13px] font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.03] sm:px-5 xl:px-6">
                Start Practising
              </button>
            </Link>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="hidden whitespace-nowrap rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-[13px] font-bold text-white/80 transition hover:bg-white/[0.08] hover:text-white sm:block">
                  Sign in
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              {/* Explicit horizontal padding keeps the avatar well clear of the viewport edge */}
              <div className="shrink-0 px-2">
                <UserButton />
              </div>
            </Show>
          </div>
        </div>

        {/* Tablet compact scrollable nav row (sm–lg only) */}
        <div className="hidden border-t border-white/[0.05] px-4 py-2 sm:block sm:px-6 lg:hidden">
          <nav className="mx-auto flex max-w-7xl gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabletNavItems.map((item) => {
              const active =
                currentPath === item.href ||
                (item.href === "/company/dashboard" && isCompanyPath(currentPath));
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`block whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition ${tabletNavClass(
                      active,
                      item.color
                    )}`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Page content — pb-20 on mobile keeps content above the bottom nav bar ── */}
      <main className="relative z-10 pb-20 sm:pb-0">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-black/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <SiteLogo href="/" size="sm" showText />
              <p className="mt-4 max-w-xs text-sm leading-6 text-gray-500">
                AI-powered interview coaching for candidates and talent teams. Built in the UK.
              </p>
              <p className="mt-5 text-xs text-gray-600">
                © {new Date().getFullYear()} AI Career Mentor Ltd · England &amp; Wales
              </p>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                Platform
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                {(
                  [
                    ["/", "Home"],
                    ["/platform", "Platform"],
                    ["/how-it-works", "How it works"],
                    ["/candidates", "Candidates"],
                    ["/practice", "Start Practising"],
                  ] as const
                ).map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    className="block transition hover:text-white"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                Account
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                {(
                  [
                    ["/pricing", "Pricing"],
                    ["/progress", "Progress"],
                    ["/profile", "Profile"],
                    ["/company/dashboard", "Company dashboard"],
                    ["/company/setup", "Create workspace"],
                  ] as const
                ).map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    className="block transition hover:text-white"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
                Company
              </p>
              <div className="space-y-3 text-sm text-gray-400">
                {(
                  [
                    ["/enterprise", "Enterprise"],
                    ["/privacy", "Privacy policy"],
                    ["/terms", "Terms of service"],
                  ] as const
                ).map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    className="block transition hover:text-white"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Mobile bottom navigation bar — replaces hamburger entirely ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.1] bg-[#080412]/96 backdrop-blur-2xl sm:hidden"
        aria-label="Mobile navigation"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex h-[60px] items-stretch">

          {/* Home */}
          <BottomNavItem href="/" label="Home" active={currentPath === "/"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M3 12l9-9 9 9" />
              <path d="M5 10v9h4v-5h6v5h4v-9" />
            </svg>
          </BottomNavItem>

          {/* Platform */}
          <BottomNavItem href="/platform" label="Platform" active={currentPath === "/platform" || currentPath === "/candidates" || currentPath === "/how-it-works"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </BottomNavItem>

          {/* Practice — elevated centre CTA */}
          <Link href="/practice" className="flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-opacity active:opacity-70">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 ${
                currentPath === "/practice"
                  ? "bg-gradient-to-br from-purple-400 via-fuchsia-400 to-blue-400 shadow-purple-900/60"
                  : "bg-gradient-to-br from-purple-500 via-fuchsia-500 to-blue-500 shadow-purple-900/40"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            </div>
            <span className="text-[9px] font-bold leading-none text-purple-300">Practice</span>
          </Link>

          {/* Progress */}
          <BottomNavItem href="/progress" label="Progress" active={currentPath === "/progress"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </BottomNavItem>

          {/* Account */}
          <BottomNavItem href="/profile" label="Account" active={currentPath === "/profile" || isCompanyPath(currentPath)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
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
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-opacity active:opacity-60"
    >
      <span className={`transition-colors ${active ? "text-white" : "text-gray-500"}`}>
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

// ─────────────────────────────────────────────────────────
// Shared UI primitives (exported for use across pages)
// ─────────────────────────────────────────────────────────

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.26em] text-purple-300/90">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl md:text-5xl">{title}</h2>
      {description && (
        <p
          className={`mt-5 text-base leading-8 text-gray-400 ${
            align === "center" ? "mx-auto max-w-3xl" : "max-w-2xl"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border border-white/[0.09] bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-7 text-gray-300 sm:text-base">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PageLinkCard({
  href,
  eyebrow,
  title,
  description,
  image,
}: PageLinkCardProps) {
  return (
    <Link href={href} className="block">
      <div className="group h-full overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-white/[0.04] shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.06]">
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
          />
        </div>
        <div className="p-6">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/90">
            {eyebrow}
          </p>
          <h3 className="text-xl font-black tracking-[-0.035em]">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-gray-400">{description}</p>
          <p className="mt-4 text-xs font-black text-purple-300/80 transition group-hover:text-purple-200">
            Explore →
          </p>
        </div>
      </div>
    </Link>
  );
}
