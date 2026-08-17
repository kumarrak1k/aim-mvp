/**
 * Neutral shell â€” for pages that belong to neither audience.
 *
 * Currently used by /privacy and /terms. No nav (those pages don't need
 * one), no audience identity colour. A signed-in candidate or recruiter
 * who lands here from a footer link sees a clean, neutral chrome and the
 * "Back to home" link returns them to the split landing where they pick
 * their side again.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

import { SkipToContent } from "@/app/components/SkipToContent";

type NeutralShellProps = {
  children: ReactNode;
};

export function NeutralShell({ children }: NeutralShellProps) {
  return (
    <div className="relative min-h-screen bg-[#0a0614] text-white">
      <SkipToContent />
      {/* Subtle background â€” neutral, no audience-tinted blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,rgba(120,60,255,0.10),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
      </div>

      {/* Header â€” minimal: logo + back link */}
      <header className="sticky top-0 z-50 bg-[#0a0614]/90 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:py-3.5">
          <Link href="/" className="shrink-0">
            <SiteLogo href="" size="md" showText />
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-gray-400 transition hover:text-white"
          >
            â† Back to home
          </Link>
        </div>
      </header>

      <main id="main-content" className="relative z-10">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-black/20">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <SiteLogo href="/" size="sm" showText />
              <p className="mt-3 text-xs text-gray-400">
                Â© {new Date().getFullYear()} AI Career Mentor Â· England &amp; Wales
              </p>
            </div>
            <div className="flex flex-wrap gap-5 text-xs text-gray-400">
              {/* "Choose audience" and "Corporates" removed with the audience
                  split. One product, so there is nothing to choose between. */}
              <Link href="/" className="hover:text-gray-400">
                Home
              </Link>
              <Link href="/contact" className="hover:text-gray-400">
                Contact
              </Link>
              <Link href="/privacy" className="hover:text-gray-400">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-gray-400">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
