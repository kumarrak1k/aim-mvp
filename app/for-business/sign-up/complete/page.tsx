"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

/**
 * Post-signup landing for the business flow. Stamps accountType =
 * "corporate" then forwards to /company/setup so the recruiter can name
 * their workspace and become the admin member.
 */
export default function BusinessSignUpCompletePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/for-business/sign-in");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await fetch("/api/account-type", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountType: "corporate" }),
        });
      } catch {
        // Non-fatal — lazy migration in getAccountType() will catch this.
      }

      if (!cancelled) {
        router.replace("/company/setup");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0614] px-4 text-white">
      <div className="w-full max-w-md rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-2xl shadow-fuchsia-950/30 backdrop-blur-2xl">
        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
        <h1 className="text-xl font-black tracking-[-0.03em]">
          Setting up your hiring workspace...
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Almost there. Taking you to workspace setup.
        </p>
      </div>
    </main>
  );
}
