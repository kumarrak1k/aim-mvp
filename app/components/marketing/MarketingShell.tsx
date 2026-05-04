"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";

type MarketingPath =
  | "/"
  | "/platform"
  | "/how-it-works"
  | "/candidates"
  | "/pricing"
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

const navItems = [
  { href: "/", label: "Home" },
  { href: "/platform", label: "Platform" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/candidates", label: "Candidates" },
  { href: "/pricing", label: "Pricing" },
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

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#120d1e]/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-2 rounded-[1.35rem] bg-purple-500/25 blur-xl" />
              <div className="relative rounded-[1.2rem] border border-white/20 bg-white p-2 shadow-xl shadow-purple-950/40">
                <img
                  src="/brand/logo.jpg"
                  alt="AI Career Mentor"
                  className="h-11 w-11 rounded-xl object-contain sm:h-12 sm:w-12"
                />
              </div>
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-[-0.04em] sm:text-lg">
                AI Career Mentor
              </p>
              <p className="hidden text-xs text-purple-100/60 sm:block">
                Interview coaching platform
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => {
              const active = currentPath === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      active
                        ? "bg-white/[0.09] text-white"
                        : "text-gray-300 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="hidden rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-black text-white transition hover:bg-white/[0.09] sm:block">
                  Sign in
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <Link href="/profile">
                <button
                  className={`hidden rounded-full px-4 py-2 text-sm font-black transition sm:block ${
                    currentPath === "/profile"
                      ? "border border-purple-300/35 bg-purple-300/15 text-purple-50"
                      : "border border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.09]"
                  }`}
                >
                  Candidate Profile
                </button>
              </Link>
              <UserButton />
            </Show>

            <Link href="/practice">
              <button className="rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-4 py-2.5 text-sm font-black text-white shadow-xl shadow-purple-950/35 transition hover:scale-[1.02] sm:px-5">
                Start Practising
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10">{children}</div>

      <footer className="relative z-10 border-t border-white/10 bg-black/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-[1rem] border border-white/20 bg-white p-1.5">
              <img
                src="/brand/logo.jpg"
                alt="AI Career Mentor"
                className="h-10 w-10 rounded-lg object-contain"
              />
            </div>
            <div>
              <p className="font-black">AI Career Mentor</p>
              <p className="text-xs text-gray-400">
                Interview coaching for answers, voice and presence
              </p>
            </div>
          </div>

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