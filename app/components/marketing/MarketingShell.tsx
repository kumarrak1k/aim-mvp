"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

type MarketingPath =
  | "/"
  | "/platform"
  | "/how-it-works"
  | "/candidates"
  | "/pricing"
  | "/progress"
  | "/profile";

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

const compactNavItems: Array<{ href: MarketingPath; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/platform", label: "Platform" },
  { href: "/progress", label: "Progress" },
  { href: "/profile", label: "Profile" },
];

export function MarketingShell({
  children,
  currentPath,
}: MarketingShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#120d1e] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(140,92,255,0.18),transparent_35%),radial-gradient(circle_at_right,rgba(34,211,238,0.08),transparent_28%),linear-gradient(180deg,#120d1e_0%,#171224_45%,#1b1629_100%)]" />
      <div className="pointer-events-none fixed left-1/2 top-[-220px] z-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-[140px]" />
      <div className="pointer-events-none fixed right-[-140px] top-24 z-0 h-[320px] w-[320px] rounded-full bg-cyan-400/10 blur-[120px]" />
      <div className="pointer-events-none fixed left-[-140px] bottom-12 z-0 h-[320px] w-[320px] rounded-full bg-fuchsia-400/10 blur-[120px]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#120d1e]/86 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1760px] items-center gap-3 px-3 py-2.5 sm:px-5 lg:gap-5 lg:px-8 lg:py-3">
          <div className="min-w-0 shrink">
            <div className="w-fit max-w-[176px] sm:max-w-[260px] lg:max-w-[320px]">
              <SiteLogo href="/" size="md" showText />
            </div>
          </div>

          <nav className="hidden shrink-0 lg:flex">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.045] p-1.5 shadow-2xl shadow-black/10">
              {navItems.map((item) => {
                const active = currentPath === item.href;

                return (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={`block whitespace-nowrap rounded-full px-2.5 py-2 text-[12px] font-black transition xl:px-3.5 xl:text-[13px] 2xl:px-4 2xl:text-sm ${
                        active
                          ? "bg-white/[0.11] text-white shadow-lg shadow-black/10"
                          : "text-gray-300 hover:bg-white/[0.07] hover:text-white"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="ml-auto flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            <Show when="signed-in">
              <Link href="/progress">
                <button
                  className={`hidden whitespace-nowrap rounded-full px-3.5 py-2.5 text-sm font-black transition xl:block ${
                    currentPath === "/progress"
                      ? "border border-cyan-300/35 bg-cyan-300/15 text-cyan-50 shadow-xl shadow-cyan-950/10"
                      : "border border-cyan-300/15 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15"
                  }`}
                >
                  Progress
                </button>
              </Link>

              <Link href="/profile">
                <button
                  className={`hidden whitespace-nowrap rounded-full px-3.5 py-2.5 text-sm font-black transition xl:block ${
                    currentPath === "/profile"
                      ? "border border-purple-300/35 bg-purple-300/15 text-purple-50 shadow-xl shadow-purple-950/10"
                      : "border border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.09]"
                  }`}
                >
                  Profile
                </button>
              </Link>
            </Show>

            <Link href="/practice">
              <button className="whitespace-nowrap rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-4 py-2.5 text-xs font-black text-white shadow-xl shadow-purple-950/35 transition hover:scale-[1.02] sm:px-5 sm:text-sm xl:px-6">
                <span className="sm:hidden">Start</span>
                <span className="hidden sm:inline">Start Practising</span>
              </button>
            </Link>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="hidden whitespace-nowrap rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.09] sm:block">
                  Sign in
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <div className="shrink-0">
                <UserButton />
              </div>
            </Show>
          </div>
        </div>

        <div className="hidden border-t border-white/[0.06] px-4 py-2 sm:block sm:px-6 lg:hidden">
          <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {compactNavItems.map((item) => {
              const active = currentPath === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`block whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-black transition ${
                      active
                        ? item.href === "/progress"
                          ? "border border-cyan-300/30 bg-cyan-300/15 text-cyan-50"
                          : item.href === "/profile"
                            ? "border border-purple-300/30 bg-purple-300/15 text-purple-50"
                            : "bg-white/[0.12] text-white"
                        : item.href === "/progress"
                          ? "border border-cyan-300/15 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15"
                          : "border border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white"
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

      <div className="relative z-10">{children}</div>

      <footer className="relative z-10 border-t border-white/10 bg-black/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <SiteLogo href="/" size="sm" showText />

          <div className="flex flex-wrap gap-4 text-sm font-semibold text-gray-400">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/platform" className="hover:text-white">
              Platform
            </Link>
            <Link href="/how-it-works" className="hover:text-white">
              How it works
            </Link>
            <Link href="/candidates" className="hover:text-white">
              Candidates
            </Link>
            <Link href="/progress" className="hover:text-white">
              Track Progress
            </Link>
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/profile" className="hover:text-white">
              Candidate Profile
            </Link>
            <Link href="/practice" className="hover:text-white">
              Practice
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

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
      <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-purple-300">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base leading-8 text-gray-300 ${
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
      className={`rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-black/10 backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 text-sm leading-7 text-gray-300 sm:text-base"
        >
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
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
      <div className="group h-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:bg-white/[0.07]">
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        </div>

        <div className="p-6">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            {eyebrow}
          </p>
          <h3 className="text-2xl font-black tracking-[-0.035em]">{title}</h3>
          <p className="mt-3 leading-7 text-gray-300">{description}</p>
          <p className="mt-5 text-sm font-black text-purple-200">
            Explore page →
          </p>
        </div>
      </div>
    </Link>
  );
}