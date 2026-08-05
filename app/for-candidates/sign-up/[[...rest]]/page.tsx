"use client";

import { useEffect, useState } from "react";
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

  // Did they get here by clicking a PAID plan on the pricing page? Read after
  // mount so the server and first client render agree (no hydration mismatch).
  const [pendingPaidPlan, setPendingPaidPlan] = useState(false);
  useEffect(() => {
    try {
      setPendingPaidPlan(Boolean(sessionStorage.getItem("aim_pending_plan")));
    } catch {
      /* sessionStorage unavailable — keep the free-signup wording */
    }
  }, []);

  // Marketing-email preference — TICKED by default under PECR's soft opt-in
  // (reg 22(3)): we market only our own similar services to people signing up
  // for the service, with a clear chance to refuse HERE and a one-click
  // unsubscribe in every email. (A pre-ticked box is not GDPR "consent" — this
  // deliberately relies on the soft opt-in exception, not consent.)
  // Captured to sessionStorage so the post-signup step can persist it; the
  // default is written on mount so an untouched box still records the choice.
  const [marketingConsent, setMarketingConsent] = useState(true);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("aim_marketing_consent") === null) {
        sessionStorage.setItem("aim_marketing_consent", "1");
      } else {
        setMarketingConsent(sessionStorage.getItem("aim_marketing_consent") === "1");
      }
    } catch {
      /* ignore */
    }
  }, []);
  function onConsentChange(checked: boolean) {
    setMarketingConsent(checked);
    try {
      sessionStorage.setItem("aim_marketing_consent", checked ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0614] text-white">
      <DataTrustStrip variant="topbar" />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.10),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.06),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.08] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.08] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] px-4 pt-3 pb-8 sm:px-6 lg:px-10">
        {/* Compact header */}
        <header className="mb-3 flex items-center justify-between sm:mb-4">
          <Link href="/" className="flex items-center gap-3">
            <SiteLogo href="" size="md" showText />
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/for-candidates"
              className="hidden text-gray-400 hover:text-white sm:inline-block"
            >
              ← Back to overview
            </Link>
          </div>
        </header>

        <div className="mx-auto w-full max-w-md mt-2">
        <section className="w-full max-w-md">
          {/* Compact heading. Someone who arrived by clicking a PAID plan is
              not here to "start practising free" — tell them the account comes
              first and payment follows, so the extra step makes sense. */}
          <div className="mb-4 text-center">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {pendingPaidPlan ? "Create your account." : "Start practising free."}
            </h1>
            <p className="mt-1.5 text-sm leading-5 text-gray-400">
              {pendingPaidPlan
                ? "One quick step, then we will take you to secure payment."
                : "Create your account and run your first interview in minutes."}
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
                dividerLine: "bg-white/[0.1]",
                dividerText: "text-gray-500",
              },
              variables: {
                colorPrimary: "#a855f7",
                colorBackground: "transparent",
              },
            }}
          />

          {/* Marketing preference — ticked by default (PECR soft opt-in); the
              label is the clear refusal opportunity the exception requires. */}
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5 text-left">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => onConsentChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-purple-500"
            />
            <span className="text-xs leading-5 text-gray-400">
              Email me interview tips, practice nudges and trial reminders about
              AI Career Mentor. Untick to opt out: you can also unsubscribe from
              any email with one click, and we never sell your data. Essential
              account emails are always sent.
            </span>
          </label>

          <div className="mt-4 text-center">
            <p className="mb-2 text-xs text-gray-500">Already have an account?</p>
            <Link
              href="/for-candidates/sign-in"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.1]"
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
