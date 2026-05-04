"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

type PracticeHeaderProps = {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
};

type HeaderPath =
  | "/"
  | "/platform"
  | "/how-it-works"
  | "/candidates"
  | "/pricing";

const navItems: Array<{ href: HeaderPath; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/platform", label: "Platform" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/candidates", label: "Candidates" },
  { href: "/pricing", label: "Pricing" },
];

export function PracticeHeader({ isLoaded, isSignedIn }: PracticeHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#120d1e]/82 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1760px] items-center gap-5 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0 shrink-0">
          <div className="w-fit max-w-[255px] sm:max-w-[320px]">
            <SiteLogo href="/" size="md" showText />
          </div>
        </div>

        <nav className="hidden shrink-0 lg:flex">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.045] p-1.5 shadow-2xl shadow-black/10">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span className="block whitespace-nowrap rounded-full px-2.5 py-2 text-[12px] font-black text-gray-300 transition hover:bg-white/[0.07] hover:text-white xl:px-3.5 xl:text-[13px] 2xl:px-4 2xl:text-sm">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="ml-auto flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          {isLoaded && isSignedIn && (
            <>
              <Link href="/progress">
                <button className="hidden whitespace-nowrap rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3.5 py-2.5 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 xl:block">
                  Progress
                </button>
              </Link>

              <Link href="/profile">
                <button className="hidden whitespace-nowrap rounded-full border border-white/12 bg-white/[0.05] px-3.5 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.09] xl:block">
                  Profile
                </button>
              </Link>
            </>
          )}

          <Link href="/practice">
            <button className="whitespace-nowrap rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-4 py-2.5 text-sm font-black text-white shadow-xl shadow-purple-950/35 transition hover:scale-[1.02] sm:px-5 xl:px-6">
              Start Practising
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

      <div className="border-t border-white/[0.06] px-4 py-2 sm:px-6 lg:hidden">
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span className="block whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-black text-gray-300 transition hover:bg-white/[0.08] hover:text-white">
                {item.label}
              </span>
            </Link>
          ))}

          <Link href="/progress">
            <span className="block whitespace-nowrap rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3.5 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/15">
              Progress
            </span>
          </Link>

          <Link href="/profile">
            <span className="block whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-black text-gray-300 transition hover:bg-white/[0.08] hover:text-white">
              Profile
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}