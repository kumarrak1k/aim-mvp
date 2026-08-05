"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { SiteLogo } from "@/app/components/brand/SiteLogo";
import { DataTrustStrip } from "@/app/components/DataTrustStrip";

/**
 * Dedicated business / hiring-team sign-in page.
 *
 * Lands signed-in users on /company/dashboard. Same pattern as the
 * candidate version, just branded for the business audience.
 */
export default function BusinessSignInPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0614] text-white">
      <DataTrustStrip variant="topbar" />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.10),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.06),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.08] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.15] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl 2xl:max-w-[96rem] px-4 pt-3 pb-8 sm:px-6 lg:px-10">
        <header className="mb-3 flex items-center justify-between sm:mb-4">
          <Link href="/" className="flex items-center gap-3">
            <SiteLogo href="" size="md" showText />
            <span className="hidden rounded-full border border-purple-300/20 bg-white/[0.04] px-3 py-1 text-[10px] font-bold tracking-wide text-purple-100 sm:inline-block">
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
              href="/for-candidates/sign-in"
              className="rounded-full border border-purple-300/20 bg-purple-300/[0.07] px-3 py-1.5 font-bold text-purple-200 transition hover:bg-purple-300/[0.12]"
            >
              Candidate? Sign in here
            </Link>
          </div>
        </header>

        {/* Centring wrapper — pushes form to vertical centre of remaining space */}
        <div className="mx-auto w-full max-w-md mt-2">
        <section className="w-full max-w-md">
          <div className="mb-4 text-center">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Sign in.
            </h1>
            <p className="mt-1.5 text-sm leading-5 text-gray-400">
              Continue to your hiring team workspace.
            </p>
            <p className="mt-2 text-[11px] text-gray-600">
              Job applicant?{" "}
              <Link href="/for-candidates/sign-in" className="font-bold text-purple-300 hover:text-purple-200">
                Candidate sign-in →
              </Link>
            </p>
          </div>

          <SignIn
            routing="path"
            path="/for-business/sign-in"
            signUpUrl="/for-business/sign-up"
            forceRedirectUrl="/auth/redirect"
            fallbackRedirectUrl="/auth/redirect"
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "w-full bg-white/[0.04] border border-white/[0.08] shadow-2xl shadow-purple-950/30 backdrop-blur-2xl rounded-[1.75rem]",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-white",
                formButtonPrimary:
                  "bg-gradient-to-r from-violet-600 to-purple-600 hover:scale-[1.01] shadow-lg shadow-purple-900/30 text-white font-bold normal-case",
                formFieldInput:
                  "bg-black/30 border-white/[0.1] text-white placeholder-gray-500",
                formFieldLabel: "text-gray-300",
                footerActionText: "text-gray-400",
                footerActionLink: "text-purple-300 hover:text-purple-200",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-purple-300",
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
            <p className="mb-2 text-xs text-gray-500">Don&rsquo;t have a workspace yet?</p>
            <Link
              href="/for-business/sign-up"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.1]"
            >
              Create one →
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
