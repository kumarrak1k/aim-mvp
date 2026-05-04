"use client";

import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/platform", label: "Platform" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/candidates", label: "Candidates" },
  { href: "/pricing", label: "Pricing" },
];

export function PracticeHeader({
  isLoaded,
  isSignedIn,
}: {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#120d1e]/75 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <SiteLogo href="/" size="md" showText />

        <nav className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span className="rounded-full px-4 py-2 text-sm font-bold text-gray-300 transition hover:bg-white/[0.05] hover:text-white">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isLoaded && isSignedIn && (
            <Link href="/profile">
              <button className="hidden rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-black text-white transition hover:bg-white/[0.09] sm:block">
                Candidate Profile
              </button>
            </Link>
          )}

          {isLoaded && !isSignedIn && (
            <SignInButton mode="modal">
              <button className="hidden rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-black text-white transition hover:bg-white/[0.09] sm:block">
                Sign in
              </button>
            </SignInButton>
          )}

          <Link href="/practice">
            <button className="rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-4 py-2.5 text-sm font-black text-white shadow-xl shadow-purple-950/35 transition hover:scale-[1.02] sm:px-5">
              Start Practising
            </button>
          </Link>

          {isLoaded && isSignedIn && <UserButton />}
        </div>
      </div>
    </header>
  );
}