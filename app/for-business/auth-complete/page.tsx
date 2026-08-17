"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { clearStoredAttribution, readStoredAttribution } from "@/app/components/AttributionCapture";

/**
 * Post-signup landing for the business flow. Stamps accountType =
 * "corporate" then forwards to /company/setup so the recruiter can name
 * their workspace and become the admin member.
 *
 * Soft-checks the email domain before stamping. If the user signed up with
 * a common free/personal email provider (Gmail, Hotmail, etc.) they see a
 * warning screen explaining this is a hiring-team account. They can either
 * confirm they are indeed a recruiter ("Continue anyway") or bail to the
 * candidate sign-up. This prevents accidental corporate registrations while
 * not hard-blocking genuine recruiters who use personal emails.
 */

/** Free / personal email domains that trigger the soft warning. */
const FREE_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "hotmail.com", "hotmail.co.uk", "hotmail.fr", "hotmail.de",
  "outlook.com", "outlook.co.uk",
  "live.com", "live.co.uk", "live.fr",
  "msn.com",
  "yahoo.com", "yahoo.co.uk", "yahoo.fr", "yahoo.de", "yahoo.es",
  "ymail.com",
  "icloud.com", "me.com", "mac.com",
  "aol.com", "aol.co.uk",
  "protonmail.com", "proton.me",
  "tutanota.com", "tutamail.com",
  "mail.com", "gmx.com", "gmx.net", "gmx.co.uk",
]);

function isPersonalEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? FREE_DOMAINS.has(domain) : false;
}

type Phase = "checking" | "warning" | "processing";

export default function BusinessSignUpCompletePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [phase, setPhase] = useState<Phase>("checking");

  // Step 1 — decide whether to warn or proceed
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/for-business/sign-in");
      return;
    }
    if (phase !== "checking") return;

    const email = user?.primaryEmailAddress?.emailAddress ?? "";
    if (isPersonalEmail(email)) {
      setPhase("warning");
    } else {
      setPhase("processing");
    }
  }, [isLoaded, isSignedIn, user, phase, router]);

  // Step 2 — stamp account type and redirect (only when processing)
  useEffect(() => {
    if (phase !== "processing") return;

    let cancelled = false;

    (async () => {
      let resolvedType: string | null = null;
      try {
        const res = await fetch("/api/account-type", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountType: "corporate",
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

      // If the account was already stamped as "candidate", respect that and
      // send them to the candidate dashboard instead of the corporate setup.
      if (resolvedType === "candidate") {
        router.replace("/practice");
      } else {
        router.replace("/company/setup");
      }
    })();

    return () => { cancelled = true; };
  }, [phase, router]);

  // ── Warning screen ────────────────────────────────────────────────────────
  if (phase === "warning") {
    const email = user?.primaryEmailAddress?.emailAddress ?? "";
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0614] px-4 text-white">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.10),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.06),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
          <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.08] blur-[160px]" />
          <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.15] blur-[160px]" />
        </div>

        <div className="relative z-10 w-full max-w-md rounded-[1.75rem] border border-purple-400/20 bg-white/[0.04] p-8 shadow-2xl shadow-purple-950/30 backdrop-blur-2xl">
          {/* Icon */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10 text-2xl">
            ⚠️
          </div>

          <h1 className="mb-2 text-center text-xl font-bold tracking-tight">
            Looks like a personal email
          </h1>
          <p className="mb-1 text-center text-sm leading-6 text-gray-400">
            You signed up with{" "}
            <span className="font-bold text-white">{email}</span>.
          </p>
          <p className="mb-6 text-center text-sm leading-6 text-gray-400">
            Hiring team accounts are designed for recruiters and hiring
            managers. Are you signing up to assess candidates for a role?
          </p>

          {/* Primary — confirm they're a recruiter */}
          <button
            onClick={() => setPhase("processing")}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition hover:scale-[1.02]"
          >
            Yes, I&rsquo;m a hiring manager. Continue
          </button>

          {/* Secondary — escape to candidate flow */}
          <Link
            href="/for-candidates/sign-up"
            className="mt-3 block w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-white/[0.08]"
          >
            I&rsquo;m actually a job applicant. Take me to candidate sign-up →
          </Link>

          <p className="mt-5 text-center text-xs leading-5 text-gray-400">
            If you&rsquo;re a freelance recruiter or work from a personal
            email, you can still use a hiring team account. Just confirm
            above.
          </p>
        </div>
      </main>
    );
  }

  // ── Loading / processing screen ───────────────────────────────────────────
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0614] px-4 text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.10),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.06),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.08] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.15] blur-[160px]" />
      </div>
      <div className="relative z-10 w-full max-w-md rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] p-8 text-center shadow-2xl shadow-purple-950/30 backdrop-blur-2xl">
        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
        <h1 className="text-xl font-bold tracking-tight">
          Setting up your hiring workspace...
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Almost there. Taking you to workspace setup.
        </p>
      </div>
    </main>
  );
}
