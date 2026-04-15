import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export function SiteHeader() {
  return (
    <header className="mb-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-400 text-base font-bold text-white shadow-lg shadow-purple-500/20">
          AI
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-white">
            AI Career Mentor
          </p>
          <p className="text-xs text-gray-400">
            Interview coaching for performance, confidence, and delivery
          </p>
        </div>
      </Link>

      <nav className="hidden items-center gap-8 text-sm text-gray-300 md:flex">
        <Link href="/how-it-works" className="transition hover:text-white">
          How it works
        </Link>
        <Link href="/practice" className="transition hover:text-white">
          Practice
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              Sign In
            </button>
          </SignInButton>
        </Show>

        <Show when="signed-in">
          <UserButton />
        </Show>

        <Link
          href="/practice"
          className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          Start Practice
        </Link>
      </div>
    </header>
  );
}