"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";
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

const mobileNavSections = [
  {
    label: "Explore",
    links: [
      { href: "/" as MarketingPath, label: "Home" },
      { href: "/platform" as MarketingPath, label: "Platform" },
      { href: "/how-it-works" as MarketingPath, label: "How it works" },
      { href: "/candidates" as MarketingPath, label: "For candidates" },
      { href: "/pricing" as MarketingPath, label: "Pricing" },
      { href: "/enterprise" as MarketingPath, label: "Enterprise" },
    ],
  },
  {
    label: "Your account",
    links: [
      { href: "/practice" as MarketingPath, label: "Start practising" },
      { href: "/progress" as MarketingPath, label: "Progress" },
      { href: "/profile" as MarketingPath, label: "Profile" },
      { href: "/company/dashboard" as MarketingPath, label: "Company dashboard" },
    ],
  },
];

const tabletNavItems: Array<{ href: MarketingPath; label: string; color?: string }> = [
  { href: "/", label: "Home" },
  { href: "/platform", label: "Platform" },
  { href: "/pricing", label: "Pricing" },
  { href: "/company/dashboard", label: "Company", color: "fuchsia" },
  { href: "/progress", label: "Progress", color: "cyan" },
  { href: "/profile", label: "Profile", color: "purple" },
];

function tabletNavClass(active: boolean, color?: string) {
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

function isCompanyPath(path: MarketingPath) {
  return path === "/company/dashboard" || path === "/company/templates" || path === "/company/candidates";
}

export function MarketingShell({ children, currentPath }: MarketingShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#0f0a1a] text-white">
      {/* Background atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,60,255,0.22),transparent),radial-gradient(ellipse_50%_40%_at_85%_20%,rgba(34,211,238,0.07),transparent),linear-gradient(180deg,#0f0a1a_0%,#130e20_50%,#161228_100%)]" />
      <div className="pointer-events-none fixed left-1/2 top-[-300px] z-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-purple-600/[0.15] blur-[160px]" />
      <div className="pointer-events-none fixed right-[-160px] top-20 z-0 h-[400px] w-[400px] rounded-full bg-cyan-400/[0.07] blur-[130px]" />
      <div className="pointer-events-none fixed left-[-160px] bottom-10 z-0 h-[400px] w-[400px] rounded-full bg-fuchsia-500/[0.09] blur-[130px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0f0a1a]/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1760px] items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-10 lg:py-3.5">

          {/* Logo */}
          <div className="shrink-0">
            <SiteLogo href="/" size="md" showText />
          </div>

          {/* Desktop pill nav */}
          <nav className="hidden shrink-0 lg:flex">
            <div className="flex items-center gap-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] p-1.5">
              {navItems.map((item) => {
                const active = currentPath === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <span className={`block whitespace-nowrap rounded-full px-3 py-2 text-[12.5px] font-bold transition xl:px-4 xl:text-[13px] 2xl:text-sm ${
                      active ? "bg-white/[0.12] text-white shadow-sm" : "text-gray-400 hover:bg-white/[0.07] hover:text-white"
                    }`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              <Show when="signed-in">
                <Link href="/company/dashboard">
                  <span className={`block whitespace-nowrap rounded-full px-3 py-2 text-[12.5px] font-bold transition xl:px-4 xl:text-[13px] 2xl:text-sm ${
                    isCompanyPath(currentPath)
                      ? "bg-fuchsia-400/20 text-fuchsia-100 shadow-sm"
                      : "text-fuchsia-300/70 hover:bg-fuchsia-400/10 hover:text-fuchsia-200"
                  }`}>
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
                <button className={`hidden whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-bold transition xl:block ${
                  currentPath === "/progress"
                    ? "border border-cyan-300/30 bg-cyan-300/12 text-cyan-50"
                    : "border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200/80 hover:bg-cyan-300/12 hover:text-cyan-100"
                }`}>
                  Progress
                </button>
              </Link>
              <Link href="/profile">
                <button className={`hidden whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-bold transition xl:block ${
                  currentPath === "/profile"
                    ? "border border-purple-300/30 bg-purple-300/12 text-purple-50"
                    : "border border-white/[0.1] bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white"
                }`}>
                  Profile
                </button>
              </Link>
            </Show>

            <Link href="/practice">
              <button className="whitespace-nowrap rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-4 py-2.5 text-[13px] font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.03] sm:px-5 xl:px-6">
                <span className="sm:hidden">Start</span>
                <span className="hidden sm:inline">Start Practising</span>
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
              <div className="shrink-0">
                <UserButton />
              </div>
            </Show>

            {/* Mobile hamburger — shows below sm (640px) */}
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05] text-gray-300 transition hover:bg-white/[0.09] hover:text-white sm:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M2 2l11 11M13 2L2 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M1.5 3.5h12M1.5 7.5h12M1.5 11.5h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Tablet compact nav row (640px–1024px) */}
        <div className="hidden border-t border-white/[0.05] px-4 py-2 sm:block sm:px-6 lg:hidden">
          <nav className="mx-auto flex max-w-7xl gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabletNavItems.map((item) => {
              const active = currentPath === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <span className={`block whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition ${tabletNavClass(active, item.color)}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile full-screen menu overlay (below 640px) */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 top-[57px] z-40 overflow-y-auto bg-[#0f0a1a]/97 backdrop-blur-2xl sm:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="px-5 pt-6 pb-12" onClick={(e) => e.stopPropagation()}>
              {mobileNavSections.map((section) => (
                <div key={section.label} className="mb-7">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-gray-600">{section.label}</p>
                  <div className="flex flex-col gap-1">
                    {section.links.map(({ href, label }) => (
                      <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
                        <span className={`block rounded-2xl border px-5 py-4 text-base font-bold transition ${
                          currentPath === href
                            ? "border-purple-400/30 bg-purple-400/10 text-white"
                            : "border-white/[0.07] bg-white/[0.03] text-gray-300 active:bg-white/[0.08]"
                        }`}>
                          {label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-6 flex flex-col gap-3">
                <Link href="/practice" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 py-4 text-base font-black text-white shadow-xl shadow-purple-950/40">
                    Start Practising →
                  </button>
                </Link>
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] py-4 text-base font-bold text-white" onClick={() => setMobileMenuOpen(false)}>
                      Sign in
                    </button>
                  </SignInButton>
                </Show>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="relative z-10">{children}</div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-black/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <SiteLogo href="/" size="sm" showText />
              <p className="mt-4 max-w-xs text-sm leading-6 text-gray-500">
                AI-powered interview coaching for candidates and talent teams. Built in the UK.
              </p>
              <p className="mt-5 text-xs text-gray-600">
                © {new Date().getFullYear()} AI Career Mentor Ltd · England & Wales
              </p>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">Platform</p>
              <div className="space-y-3 text-sm text-gray-400">
                {([
                  ["/", "Home"],
                  ["/platform", "Platform"],
                  ["/how-it-works", "How it works"],
                  ["/candidates", "Candidates"],
                  ["/practice", "Start Practising"],
                ] as const).map(([href, label]) => (
                  <Link key={href} href={href} className="block transition hover:text-white">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">Account</p>
              <div className="space-y-3 text-sm text-gray-400">
                {([
                  ["/pricing", "Pricing"],
                  ["/progress", "Progress"],
                  ["/profile", "Profile"],
                  ["/company/dashboard", "Company dashboard"],
                  ["/company/setup", "Create workspace"],
                ] as const).map(([href, label]) => (
                  <Link key={href} href={href} className="block transition hover:text-white">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">Company</p>
              <div className="space-y-3 text-sm text-gray-400">
                {([
                  ["/enterprise", "Enterprise"],
                  ["/privacy", "Privacy policy"],
                  ["/terms", "Terms of service"],
                ] as const).map(([href, label]) => (
                  <Link key={href} href={href} className="block transition hover:text-white">{label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

export function SectionHeading({
  eyebrow, title, description, align = "left",
}: {
  eyebrow: string; title: string; description?: string; align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.26em] text-purple-300/90">{eyebrow}</p>
      <h2 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl md:text-5xl">{title}</h2>
      {description && (
        <p className={`mt-5 text-base leading-8 text-gray-400 ${align === "center" ? "mx-auto max-w-3xl" : "max-w-2xl"}`}>
          {description}
        </p>
      )}
    </div>
  );
}

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.75rem] border border-white/[0.09] bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl ${className}`}>
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

export function PageLinkCard({ href, eyebrow, title, description, image }: PageLinkCardProps) {
  return (
    <Link href={href} className="block">
      <div className="group h-full overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-white/[0.04] shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.06]">
        <div className="aspect-[16/10] overflow-hidden">
          <img src={image} alt={title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
        </div>
        <div className="p-6">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/90">{eyebrow}</p>
          <h3 className="text-xl font-black tracking-[-0.035em]">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-gray-400">{description}</p>
          <p className="mt-4 text-xs font-black text-purple-300/80 transition group-hover:text-purple-200">Explore →</p>
        </div>
      </div>
    </Link>
  );
}
