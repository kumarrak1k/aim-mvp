"use client";

/**
 * /auth/accept
 *
 * Minimal token-acceptance page for admin-issued sign-in links.
 *
 * Instead of sending new users to the full candidate/business sign-in
 * page (marketing chrome, "Welcome back" copy, "Hiring team?" links),
 * admin welcome emails point here. This page:
 *
 *  1. Reads ?__clerk_ticket=<token> from the URL
 *  2. Calls signIn.create({ strategy: "ticket", ticket }) — Clerk v7
 *     signals API returns { error } and updates signIn.status reactively
 *  3. Calls signIn.finalize() to activate the session
 *  4. Navigates to /auth/redirect which handles forcePasswordReset and
 *     sends the user to the correct portal
 *
 * The user sees only a full-screen spinner — no marketing shell, no
 * "Hiring team?" links, no confusing "Welcome back" heading.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

/* ------------------------------------------------------------------ */
/*  Inner component — reads searchParams (requires Suspense boundary)  */
/* ------------------------------------------------------------------ */

function AcceptInner() {
  const { signIn } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  // Prevent double-invocation in React StrictMode / re-renders
  const consumedRef = useRef(false);

  useEffect(() => {
    if (consumedRef.current) return;
    consumedRef.current = true;

    const ticket = searchParams.get("__clerk_ticket");
    if (!ticket) {
      setError("This sign-in link is missing a token. Please use the link from your welcome email or contact support.");
      return;
    }

    async function consumeTicket() {
      try {
        // Clerk v7: create() returns { error: ClerkError | null }
        const createResult = await signIn.create({
          strategy: "ticket",
          ticket: ticket ?? undefined,
        });

        if (createResult.error) {
          setError(
            createResult.error.longMessage ??
            createResult.error.message ??
            "Sign-in failed. The link may have expired."
          );
          return;
        }

        // Activate the session — finalize() sets the active session
        const finalizeResult = await signIn.finalize();

        if (finalizeResult.error) {
          setError(
            finalizeResult.error.longMessage ??
            finalizeResult.error.message ??
            "Sign-in could not be completed. Please try again."
          );
          return;
        }

        // /auth/redirect handles forcePasswordReset → /change-password
        // or sends the user directly to their portal
        router.push("/auth/redirect");
      } catch (err: unknown) {
        const clerkMsg =
          (err as { errors?: Array<{ longMessage?: string; message?: string }> })
            ?.errors?.[0]?.longMessage ??
          (err as { errors?: Array<{ message?: string }> })
            ?.errors?.[0]?.message;
        setError(
          clerkMsg ??
          (err instanceof Error ? err.message : "Failed to sign in. The link may have expired.")
        );
      }
    }

    void consumeTicket();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once — consumedRef guards against double-invocation

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0918] px-4 text-white">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/[0.08] blur-[120px]" />
        </div>

        <div className="relative flex flex-col items-center gap-6">
          <SiteLogo href="/" size="md" showText />

          <div className="mt-2 max-w-sm rounded-[1.5rem] border border-red-400/20 bg-red-500/[0.08] p-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm font-black text-red-300">Sign-in link error</p>
            <p className="mt-2 text-xs leading-6 text-red-200/60">{error}</p>
            <div className="mt-5 flex flex-col items-center gap-2">
              <a
                href="/for-candidates/sign-in"
                className="text-xs font-bold text-purple-300 hover:text-purple-200"
              >
                Candidate sign-in →
              </a>
              <a
                href="/for-business/sign-in"
                className="text-xs font-bold text-fuchsia-300 hover:text-fuchsia-200"
              >
                Hiring team sign-in →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Spinner shown while the ticket is being consumed */
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0918] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-600/[0.10] blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <SiteLogo href="" size="md" showText />
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-fuchsia-500 border-t-transparent" />
        <p className="text-sm text-gray-400">Signing you in…</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page wrapper — Suspense required by Next.js for useSearchParams    */
/* ------------------------------------------------------------------ */

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0918] text-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-fuchsia-500 border-t-transparent" />
    </div>
  );
}

export default function AuthAcceptPage() {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <AcceptInner />
    </Suspense>
  );
}
