"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { clearStoredAttribution, readStoredAttribution, readStoredPromoCode } from "@/app/components/AttributionCapture";

export default function CandidateSignUpCompletePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/for-candidates/sign-in");
      return;
    }

    let cancelled = false;

    (async () => {
      // 1. Stamp account type (fire before anything else so it's always set)
      let resolvedType: string | null = null;
      try {
        const res = await fetch("/api/account-type", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountType: "candidate",
            // First-touch acquisition snapshot captured on landing.
            attribution: readStoredAttribution(),
          }),
        });
        if (res.ok) {
          const data = await res.json() as { accountType?: string };
          resolvedType = data.accountType ?? null;
          // Snapshot persisted server-side — consume it so a future account
          // created from this browser doesn't inherit this one's source.
          clearStoredAttribution();
        }
      } catch {
        // Non-fatal — lazy migration in getAccountType() will catch this.
      }

      if (cancelled) return;

      // Superadmin accounts cannot be used as candidate/corporate.
      if (resolvedType === "superadmin") {
        router.replace("/admin");
        return;
      }

      // If the account was already stamped as "corporate", respect that and
      // send them to the corporate dashboard rather than the candidate one.
      if (resolvedType === "corporate") {
        router.replace("/company/dashboard");
        return;
      }

      // 2. Persist the marketing-email consent captured at sign-up, then
      //    enqueue the nurture/trial email sequence (fire and forget).
      const consentRaw = sessionStorage.getItem("aim_marketing_consent");
      sessionStorage.removeItem("aim_marketing_consent");
      fetch("/api/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketingConsent: consentRaw === "1",
          source: "signup",
        }),
      })
        .catch(() => {})
        .finally(() => {
          fetch("/api/nurture/enqueue", { method: "POST" }).catch(() => {});
        });

      // 3. Credit referral if present
      const ref = sessionStorage.getItem("aim_ref");
      if (ref) {
        sessionStorage.removeItem("aim_ref");
        fetch("/api/referral/use", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: ref }),
        }).catch(() => {});
      }

      // 4. If the user clicked a paid plan on the pricing page before signing
      //    up, the plan ID was saved to sessionStorage. Redirect them straight
      //    to Stripe checkout so subscription selection is part of sign-up.
      const pendingPlan = sessionStorage.getItem("aim_pending_plan");
      if (pendingPlan) {
        sessionStorage.removeItem("aim_pending_plan");
        // Promotion code captured from a ?promo= marketing link on any page
        // (same-tab pricing capture, then the first-touch snapshot).
        const promoCode = readStoredPromoCode();
        try {
          const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId: pendingPlan, promoCode }),
          });
          if (res.ok) {
            const { url } = (await res.json()) as { url?: string };
            if (url && !cancelled) {
              window.location.href = url;
              return;
            }
          }
        } catch {
          // Checkout failed — fall through to the profile page
        }
      }

      // Hand off to the default destination and let the accept-terms →
      // resolvePostAuthDestination chain route the user. Hardcoding /profile
      // here made the resolver treat it as an explicitly requested deep link
      // (which always wins), so every fresh signup skipped the onboarding
      // flow. "/practice" is the resolver's DEFAULT_DESTINATION, which it
      // does NOT treat as explicit — new candidates get terms → onboarding,
      // returning users go straight to practice.
      if (!cancelled) {
        router.replace("/practice");
      }
    })();

    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 page-glow" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.08] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.08] blur-[160px]" />
      </div>
      <div className="relative z-10 w-full max-w-md rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-2xl shadow-purple-950/30 backdrop-blur-2xl">
        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
        <h1 className="text-xl font-bold tracking-tight">
          Setting up your account…
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Almost there. Getting everything ready for you.
        </p>
        {error && (
          <p className="mt-4 text-xs text-red-300">{error}</p>
        )}
      </div>
    </main>
  );
}
