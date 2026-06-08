"use client";

import { useState } from "react";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { SiteLogo } from "@/app/components/brand/SiteLogo";
import { DataTrustStrip } from "@/app/components/DataTrustStrip";

/**
 * Dedicated candidate sign-up page.
 *
 * After successful sign-up Clerk redirects to /for-candidates/sign-up/complete,
 * which immediately calls POST /api/account-type to brand the user as
 * "candidate" in privateMetadata, then forwards them to /practice.
 *
 * This approach (a thin redirect step) keeps Clerk's sign-up flow vanilla
 * — no Clerk webhooks needed, no custom server flows. The accountType is
 * locked in before the user sees their first authed page.
 */
export default function CandidateSignUpPage() {
  // Persist referral code across Clerk's multi-step sign-up flow
  if (typeof window !== "undefined") {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) sessionStorage.setItem("aim_ref", ref);
  }

  // Marketing-email consent — unticked by default (UK PECR: explicit opt-in).
  // Captured to sessionStorage so the post-signup step can persist it.
  const [marketingConsent, setMarketingConsent] = useState(false);
  function onConsentChange(checked: boolean) {
    setMarketingConsent(checked);
    try {
      sessionStorage.setItem("aim_marketing_consent", checked ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a0614] text-white">
      <DataTrustStrip variant="topbar" />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.18] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.18] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full flex-1 max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
        {/* Compact header */}
        <header className="mb-4 flex items-center justify-between sm:mb-5">
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
              href="/for-business/sign-up"
              className="rounded-full border border-purple-300/20 bg-purple-300/[0.07] px-3 py-1.5 font-bold text-purple-200 transition hover:bg-purple-300/[0.12]"
            >
              Hiring team? Sign up here
            </Link>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-6">
        <section className="w-full max-w-md">
          {/* Compact heading */}
          <div className="mb-4 text-center">
            <h1 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">
              Start practising free.
            </h1>
            <p className="mt-1.5 text-sm leading-5 text-gray-400">
              Create your account and run your first interview in minutes.
            </p>
            <p className="mt-2 text-[11px] text-gray-600">
              Hiring manager?{" "}
              <Link href="/for-business/sign-up" className="font-bold text-purple-300 hover:text-purple-200">
                Create a hiring team account →
              </Link>
            </p>
          </div>

          <SignUp
            routing="path"
            path="/for-candidates/sign-up"
            signInUrl="/for-candidates/sign-in"
            forceRedirectUrl="/for-candidates/sign-up/complete"
            fallbackRedirectUrl="/for-candidates/sign-up/complete"
            appearance={{
              elements: {
                rootBox: "w-full",
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
                colorText: "#ffffff",
                colorBackground: "transparent",
                colorInputBackground: "rgba(0,0,0,0.3)",
                colorInputText: "#ffffff",
              },
            }}
          />

          {/* Marketing consent — explicit opt-in, unticked by default */}
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5 text-left">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => onConsentChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-purple-500"
            />
            <span className="text-xs leading-5 text-gray-400">
              Email me interview tips, practice nudges and trial reminders. You can
              unsubscribe any time, and we never sell your data. Essential account
              emails are always sent.
            </span>
          </label>

          <div className="mt-4 text-center">
            <p className="mb-2 text-xs text-gray-500">Already have an account?</p>
            <Link
              href="/for-candidates/sign-in"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.1]"
            >
              Sign in →
            </Link>
          </div>
        </section>
        </div>

        <footer className="mt-auto border-t border-white/[0.06] pt-4 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} AI Career Mentor ·{" "}
          <Link href="/privacy" className="hover:text-gray-400">Privacy</Link> ·{" "}
          <Link href="/terms" className="hover:text-gray-400">Terms</Link> ·{" "}
          <Link href="/contact" className="hover:text-gray-400">Contact</Link>
        </footer>
      </div>
    </main>
  );
}
