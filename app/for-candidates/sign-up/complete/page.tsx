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
      // 1. Stamp account type
      try {
        await fetch("/api/account-type", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountType: "candidate" }),
        });
      } catch {
        // Non-fatal — lazy migration in getAccountType() will catch this.
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

      if (!cancelled) {
        router.replace("/practice");
      }
    })();

    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0614] px-4 text-white">
      <div className="w-full max-w-md rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-2xl shadow-purple-950/30 backdrop-blur-2xl">
        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
        <h1 className="text-xl font-black tracking-[-0.03em]">
          Setting up your candidate account...
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
