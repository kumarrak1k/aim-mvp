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
  | "/pricing"
  | "/progress"
  | "/profile";

const navItems: Array<{ href: HeaderPath; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/platform", label: "Platform" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/candidates", label: "Candidates" },
  { href: "/pricing", label: "Pricing" },
];

const compactNavItems: Array<{ href: HeaderPath; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/platform", label: "Platform" },
  { href: "/progress", label: "Progress" },
  { href: "/profile", label: "Profile" },
];

export function PracticeHeader({ isLoaded, isSignedIn }: PracticeHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#120d1e]/86 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1760px] items-center gap-3 px-3 py-2.5 sm:px-5 lg:gap-5 lg:px-8 lg:py-3">
        <div className="min-w-0 shrink">
          <div className="w-fit max-w-[176px] sm:max-w-[260px] lg:max-w-[320px]">
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
          {compactNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span
                className={`block whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-black transition ${
                  item.href === "/progress"
                    ? "border border-cyan-300/15 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15"
                    : "border border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}