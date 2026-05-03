"use client";

import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";

export function PracticeHeader({
  isLoaded,
  isSignedIn,
}: {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07030d]/85 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute -inset-2 rounded-2xl bg-purple-500/25 blur-xl" />
            <div className="relative rounded-2xl border border-white/15 bg-white/95 p-1 shadow-lg shadow-purple-950/40">
              <img
                src="/brand/logo.jpg"
                alt="AI Career Mentor"
                className="h-10 w-10 rounded-xl object-contain sm:h-11 sm:w-11"
              />
            </div>
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-black tracking-[-0.03em] sm:text-lg">
              AI Career Mentor
            </p>
            <p className="hidden text-xs font-medium text-purple-100/55 sm:block">
              Interview intelligence platform
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/">
            <button className="hidden rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-black text-white transition hover:bg-white/[0.1] sm:block">
              Home
            </button>
          </Link>

          {isLoaded && isSignedIn && (
            <Link href="/profile">
              <button className="hidden rounded-full border border-purple-300/20 bg-purple-300/10 px-4 py-2 text-sm font-black text-purple-100 transition hover:bg-purple-300/15 sm:block">
                Profile
              </button>
            </Link>
          )}

          {!isSignedIn && (
            <SignInButton mode="modal">
              <button className="rounded-full bg-white px-4 py-2.5 text-sm font-black text-black shadow-xl shadow-purple-950/20 transition hover:bg-purple-100 sm:px-5">
                Sign In
              </button>
            </SignInButton>
          )}

          {isLoaded && isSignedIn && <UserButton />}
        </div>
      </div>
    </header>
  );
}
