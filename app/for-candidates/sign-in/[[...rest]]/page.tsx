"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

/**
 * Dedicated candidate sign-in page.
 *
 * The Clerk catch-all `[[...rest]]` segment lets Clerk handle multi-step
 * flows (verification codes, MFA, etc.) under this same URL.
 *
 * Sign-in here always lands signed-in users on /practice (the personal
 * candidate dashboard). Recruiters who try this URL by mistake will still
 * sign in successfully — but on first visit to a candidate page, the
 * accountType gating (Session 2) will redirect them out. For now the
 * audience landing pages link only to the matching sign-in.
 */
export default function CandidateSignInPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0614] text-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(120,60,255,0.18),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_100%)]" />
        <div className="absolute left-1/2 top-[-200px] h-[480px] w-[800px] -translate-x-1/2 rounded-full bg-purple-600/[0.16] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        {/* Top bar */}
        <header className="mb-8 flex items-center justify-between sm:mb-12">
          <Link href="/" className="flex items-center gap-3">
            <SiteLogo href="" size="md" showText />
            <span className="hidden rounded-full border border-purple-300/20 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-purple-100 sm:inline-block">
              For candidates
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/for-candidates"
              className="hidden text-gray-400 hover:text-white sm:inline-block"
            >
              ← Back to overview
            </Link>
            <Link
              href="/for-business/sign-in"
              className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/[0.07] px-3 py-1.5 font-bold text-fuchsia-200 transition hover:bg-fuchsia-300/[0.12]"
            >
              Hiring team? Sign in here
            </Link>
          </div>
        </header>

        {/* Centred sign-in card */}
        <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-10">
          <div className="mb-7 text-center">
            <h1 className="text-3xl font-black tracking-[-0.045em] sm:text-4xl">
              Welcome back, candidate.
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Sign in to your interview practice and assessment centre account.
            </p>
          </div>

          <SignIn
            routing="path"
            path="/for-candidates/sign-in"
            signUpUrl="/for-candidates/sign-up"
            forceRedirectUrl="/practice"
            fallbackRedirectUrl="/practice"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-white/[0.04] border border-white/[0.08] shadow-2xl shadow-purple-950/30 backdrop-blur-2xl rounded-[1.75rem]",
                headerTitle: "text-white",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton:
                  "border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-white",
                formButtonPrimary:
                  "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 hover:scale-[1.01] shadow-lg shadow-purple-900/30 text-white font-black normal-case",
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
                colorText: "#ffffff",
                colorBackground: "transparent",
                colorInputBackground: "rgba(0,0,0,0.3)",
                colorInputText: "#ffffff",
              },
            }}
          />

          <p className="mt-6 text-center text-xs text-gray-500">
            Don&rsquo;t have an account yet?{" "}
            <Link
              href="/for-candidates/sign-up"
              className="font-black text-purple-300 hover:text-purple-200"
            >
              Start free →
            </Link>
          </p>
        </section>

        <footer className="mt-auto border-t border-white/[0.06] pt-5 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} AI Career Mentor Ltd ·{" "}
          <Link href="/privacy" className="hover:text-gray-400">Privacy</Link> ·{" "}
          <Link href="/terms" className="hover:text-gray-400">Terms</Link>
        </footer>
      </div>
    </main>
  );
}
