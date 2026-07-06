"use client";

/**
 * Candidate trial banner — shown across all authed candidate pages (mounted
 * in CandidateAppShell, just below the header).
 *
 * Four states, driven by GET /api/subscription:
 *   - paid              → render nothing
 *   - active trial      → countdown + "upgrade to keep access"
 *   - eligible (free, never trialed) → "start your free 3-day trial"
 *   - trial used (free) → gentle, dismissible "upgrade" nudge
 */

import { useEffect, useState } from "react";
import Link from "next/link";

type SubscriptionState = {
  isTrial: boolean;
  isPaid: boolean;
  isPastDue: boolean;
  trialConsumed: boolean;
  trialDaysRemaining: number;
  planName: string;
  paidPlanName: string;
};

const EXPIRED_DISMISS_KEY = "aim_trial_expired_dismissed";

export function TrialBanner() {
  const [sub, setSub] = useState<SubscriptionState | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [expiredDismissed, setExpiredDismissed] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data) setSub(data as SubscriptionState);
      })
      .catch(() => {});

    // Don't re-nag about an expired trial within the same browser session.
    try {
      setExpiredDismissed(
        sessionStorage.getItem(EXPIRED_DISMISS_KEY) === "1"
      );
    } catch {
      setExpiredDismissed(false);
    }
    return () => {
      active = false;
    };
  }, []);

  async function startTrial() {
    setStarting(true);
    setStartError("");
    try {
      const res = await fetch("/api/trial/start", { method: "POST" });
      if (res.ok) {
        // Reload so every server component re-reads the new entitlement.
        window.location.reload();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setStartError(data.message ?? "Could not start trial. Please try again.");
      setStarting(false);
    } catch {
      setStartError("Could not start trial. Please try again.");
      setStarting(false);
    }
  }

  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      /* fall through to re-enable the button */
    }
    setPortalLoading(false);
  }

  function dismissExpired() {
    setExpiredDismissed(true);
    try {
      sessionStorage.setItem(EXPIRED_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (!sub) return null;

  // ── Payment past due — grace window. Shown even though access is still live
  //    (isPaid stays true through Stripe's dunning) so the user can fix their
  //    card before the subscription is cancelled. ─────────────────────────────
  if (sub.isPastDue) {
    const planLabel =
      sub.paidPlanName && sub.paidPlanName !== "Free" ? sub.paidPlanName : "subscription";
    return (
      <div className="relative z-40 border-b border-amber-400/30 bg-amber-500/[0.14]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center sm:px-6">
          <span className="text-[13px] font-semibold text-amber-100">
            <span aria-hidden>⚠️ </span>
            Your last payment didn&rsquo;t go through. Update your card to keep your{" "}
            <strong className="font-black">{planLabel}</strong> access.
          </span>
          <button
            onClick={openBillingPortal}
            disabled={portalLoading}
            className="rounded-full bg-amber-400 px-3.5 py-1 text-[12px] font-black text-[#3a2a00] shadow transition hover:scale-[1.03] disabled:opacity-60"
          >
            {portalLoading ? "Opening…" : "Update card →"}
          </button>
        </div>
      </div>
    );
  }

  if (sub.isPaid) return null;

  // ── Active trial — countdown ──────────────────────────────────────────────
  if (sub.isTrial) {
    const days = Math.max(0, sub.trialDaysRemaining);
    const urgent = days <= 2;
    const dayLabel = days === 1 ? "1 day" : `${days} days`;
    return (
      <div
        className={`relative z-40 border-b ${
          urgent
            ? "border-amber-400/25 bg-amber-500/[0.12]"
            : "border-purple-500/25 bg-[#170c2e]"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center sm:px-6">
          <span className="text-[13px] font-semibold text-gray-100">
            <span aria-hidden>✨ </span>
            You&rsquo;re on the <strong className="font-black">Plus</strong>{" "}
            free trial, with{" "}
            <span className={urgent ? "text-amber-200" : "text-purple-200"}>
              {dayLabel} left
            </span>
            .
          </span>
          <Link
            href="/for-candidates/pricing"
            className="rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-3.5 py-1 text-[12px] font-black text-white shadow transition hover:scale-[1.03]"
          >
            Upgrade to keep access →
          </Link>
        </div>
      </div>
    );
  }

  // ── Eligible free user (never trialed) — offer to start ───────────────────
  if (!sub.trialConsumed) {
    return (
      <div className="relative z-40 border-b border-purple-500/25 bg-[#170c2e]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center sm:px-6">
          <span className="text-[13px] font-semibold text-gray-100">
            <span aria-hidden>🎁 </span>
            Unlock voice &amp; camera coaching and unlimited practice,{" "}
            <strong className="font-black">free for 3 days, no payment details</strong>.
          </span>
          <button
            onClick={startTrial}
            disabled={starting}
            className="rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-3.5 py-1 text-[12px] font-black text-white shadow transition hover:scale-[1.03] disabled:opacity-60"
          >
            {starting ? "Starting…" : "Start free trial"}
          </button>
          {startError && (
            <span className="text-[12px] font-semibold text-amber-300">
              {startError}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Trial used, now on Free — gentle dismissible nudge ────────────────────
  if (!expiredDismissed) {
    return (
      <div className="relative z-40 border-b border-white/[0.08] bg-white/[0.03]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center sm:px-6">
          <span className="text-[13px] font-semibold text-gray-300">
            Your free trial has ended. You&rsquo;re on the Free plan.
          </span>
          <Link
            href="/for-candidates/pricing"
            className="rounded-full border border-purple-300/25 bg-purple-300/[0.08] px-3.5 py-1 text-[12px] font-black text-purple-100 transition hover:bg-purple-300/[0.14]"
          >
            Upgrade →
          </Link>
          <button
            onClick={dismissExpired}
            aria-label="Dismiss"
            className="text-gray-500 transition hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
