"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

/**
 * Dedicated business / hiring-team sign-up page.
 * After sign-up Clerk redirects to /for-business/sign-up/complete which
 * stamps accountType = "corporate" and forwards to /company/setup so the
 * recruiter can name their workspace.
 */
export default function BusinessSignUpPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0614] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(232,80,180,0.18),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(120,60,255,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.18] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.15] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <header className="mb-8 flex items-center justify-between sm:mb-12">
          <Link href="/" className="flex items-center gap-3">
            <SiteLogo href="" size="md" showText />
            <span className="hidden rounded-full border border-fuchsia-300/20 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-100 sm:inline-block">
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

        <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-10">
          <div className="mb-7 text-center">
            <h1 className="text-3xl font-black tracking-[-0.045em] sm:text-4xl">
              Create your hiring workspace.
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Build your assessment templates, send invite links, and review
              structured candidate scoring — all in one place.
            </p>
          </div>

          {/* Account-type confirmation — makes it unambiguous before they fill the form */}
          <div className="mb-5 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/[0.08] px-4 py-3.5">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-300">
              Hiring team account
            </p>
            <ul className="space-y-1 text-xs text-gray-400">
              <li>✓ Create structured interview &amp; assessment templates</li>
              <li>✓ Send invite links to candidates</li>
              <li>✓ Review AI-scored candidate responses</li>
            </ul>
            <p className="mt-3 border-t border-white/[0.06] pt-3 text-[11px] text-gray-500">
              Are you a job applicant?{" "}
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
                rootBox: "w-full",
                card: "bg-white/[0.04] border border-white/[0.08] shadow-2xl shadow-fuchsia-950/30 backdrop-blur-2xl rounded-[1.75rem]",
                headerTitle: "text-white",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton:
                  "border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-white",
                formButtonPrimary:
                  "bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:scale-[1.01] shadow-lg shadow-fuchsia-900/30 text-white font-black normal-case",
                formFieldInput:
                  "bg-black/30 border-white/[0.1] text-white placeholder-gray-500",
                formFieldLabel: "text-gray-300",
                footerActionText: "text-gray-400",
                footerActionLink: "text-fuchsia-300 hover:text-fuchsia-200",
                dividerLine: "bg-white/[0.1]",
                dividerText: "text-gray-500",
              },
              variables: {
                colorPrimary: "#d946ef",
                colorText: "#ffffff",
                colorBackground: "transparent",
                colorInputBackground: "rgba(0,0,0,0.3)",
                colorInputText: "#ffffff",
              },
            }}
          />

          <p className="mt-6 text-center text-xs text-gray-500">
            Already have a workspace?{" "}
            <Link
              href="/for-business/sign-in"
              className="font-black text-fuchsia-300 hover:text-fuchsia-200"
            >
              Sign in →
            </Link>
          </p>
        </section>

        <footer className="mt-auto border-t border-white/[0.06] pt-5 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} AI Career Mentor Ltd ·{" "}
          <Link href="/privacy" className="hover:text-gray-400">Privacy</Link> ·{" "}
          <Link href="/terms" className="hover:text-gray-400">Terms</Link> ·{" "}
          <Link href="/contact" className="hover:text-gray-400">Contact</Link>
        </footer>
      </div>
    </main>
  );
}
