"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { SiteLogo } from "@/app/components/brand/SiteLogo";
import { DataTrustStrip } from "@/app/components/DataTrustStrip";

/**
 * Dedicated business / hiring-team sign-up page.
 * After sign-up Clerk redirects to /for-business/sign-up/complete which
 * stamps accountType = "corporate" and forwards to /company/setup so the
 * recruiter can name their workspace.
 */
export default function BusinessSignUpPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0614] text-white">
      <DataTrustStrip variant="topbar" />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.18] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.15] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-3 pb-8 sm:px-6 lg:px-10">
        {/* Compact header */}
        <header className="mb-3 flex items-center justify-between sm:mb-4">
          <Link href="/" className="flex items-center gap-3">
            <SiteLogo href="" size="md" showText />
            <span className="hidden rounded-full border border-purple-300/20 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-purple-100 sm:inline-block">
              For hiring teams
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/for-business"
              className="hidden text-gray-400 hover:text-white sm:inline-block"
            >
              ← Back to overview
            </Link>
            <Link
              href="/for-candidates/sign-up"
              className="rounded-full border border-purple-300/20 bg-purple-300/[0.07] px-3 py-1.5 font-bold text-purple-200 transition hover:bg-purple-300/[0.12]"
            >
              Candidate? Sign up here
            </Link>
          </div>
        </header>

        <div className="mx-auto w-full max-w-md mt-2">
        <section className="w-full max-w-md">
          {/* Compact heading */}
          <div className="mb-4 text-center">
            <h1 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">
              Create your hiring workspace.
            </h1>
            <p className="mt-1.5 text-sm leading-5 text-gray-400">
              Build templates, send invite links, and review AI-scored candidates.
            </p>
            <p className="mt-2 text-[11px] text-gray-600">
              Job applicant?{" "}
              <Link href="/for-candidates/sign-up" className="font-bold text-purple-300 hover:text-purple-200">
                Create a candidate account instead →
              </Link>
            </p>
          </div>

          <SignUp
            routing="path"
            path="/for-business/sign-up"
            signInUrl="/for-business/sign-in"
            forceRedirectUrl="/for-business/sign-up/complete"
            fallbackRedirectUrl="/for-business/sign-up/complete"
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "w-full bg-white/[0.04] border border-white/[0.08] shadow-2xl shadow-purple-950/30 backdrop-blur-2xl rounded-[1.75rem]",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-white",
                formButtonPrimary:
                  "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 hover:scale-[1.01] shadow-lg shadow-purple-900/30 text-white font-black normal-case",
                formFieldInput:
                  "bg-black/30 border-white/[0.1] text-white placeholder-gray-500",
                formFieldLabel: "text-gray-300",
                footerActionText: "text-gray-400",
                footerActionLink: "text-purple-300 hover:text-purple-200",
                dividerLine: "bg-white/[0.1]",
                dividerText: "text-gray-500",
              },
              variables: {
                colorPrimary: "#a855f7",
                colorBackground: "transparent",
              },
            }}
          />

          <div className="mt-4 text-center">
            <p className="mb-2 text-xs text-gray-500">Already have a workspace?</p>
            <Link
              href="/for-business/sign-in"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.1]"
            >
              Sign in →
            </Link>
          </div>
        </section>
        </div>

        <footer className="mt-12 border-t border-white/[0.06] pt-4 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} AI Career Mentor ·{" "}
          <Link href="/privacy" className="hover:text-gray-400">Privacy</Link> ·{" "}
          <Link href="/terms" className="hover:text-gray-400">Terms</Link> ·{" "}
          <Link href="/contact" className="hover:text-gray-400">Contact</Link>
        </footer>
      </div>
    </main>
  );
}
