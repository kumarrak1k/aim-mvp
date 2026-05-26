"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

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
          body: JSON.stringify({ accountType: "candidate" }),
        });
        if (res.ok) {
          const data = await res.json() as { accountType?: string };
          resolvedType = data.accountType ?? null;
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

      // 2. Enqueue nurture email sequence (fire and forget)
      fetch("/api/nurture/enqueue", { method: "POST" }).catch(() => {});

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
        try {
          const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId: pendingPlan }),
          });
          if (res.ok) {
            const { url } = (await res.json()) as { url?: string };
            if (url && !cancelled) {
              window.location.href = url;
              return;
            }
          }
        } catch {
          // Checkout failed — fall through to /practice
        }
      }

      if (!cancelled) {
        router.replace("/practice");
      }
    })();

    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0614] px-4 text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.18] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.18] blur-[160px]" />
      </div>
      <div className="relative z-10 w-full max-w-md rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-2xl shadow-purple-950/30 backdrop-blur-2xl">
        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
        <h1 className="text-xl font-black tracking-[-0.03em]">
          Setting up your account…
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Almost there. Taking you to your practice dashboard.
        </p>
        {error && (
          <p className="mt-4 text-xs text-red-300">{error}</p>
        )}
      </div>
    </main>
  );
}
