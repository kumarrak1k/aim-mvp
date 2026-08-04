"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  readConsent,
  setConsent,
  CONSENT_ACCEPTED,
  CONSENT_ESSENTIAL,
} from "@/app/lib/analyticsConsent";

/**
 * Routes where the banner must never appear: live interview / assessment
 * screens. The dialog is fixed at z-[9999] over the page, and on these
 * screens it can cover the recording controls — a first-session candidate
 * (who by definition hasn't answered the prompt yet) could be unable to
 * press "Start recording". Consent is simply asked on the next
 * non-critical page instead; analytics stays off until answered.
 */
const SUPPRESSED_PREFIXES = [
  "/practice/session",
  "/assessment-centre",
  // The signup funnel: the dialog covered the onboarding Continue button
  // (caught by the onboarding e2e spec) and would equally cover the terms
  // form. A brand-new user is exactly who hasn't dismissed it yet.
  "/onboarding",
  "/accept-terms",
];

/**
 * Cookie and analytics consent.
 *
 * This is a genuine choice, not an acknowledgement. Behavioural analytics
 * records page journeys, dwell time and AI-mentor questions against a named
 * account, which is not strictly necessary to deliver the service — so it
 * needs consent that can actually be refused, and refusing must be no harder
 * than accepting. Both buttons are therefore equally prominent and one click.
 *
 * Nothing is tracked until "Accept analytics" is pressed: the gate in
 * app/lib/analyticsConsent.ts defaults to denied, so a dismissed or ignored
 * banner leaves telemetry off.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Older visitors hold the legacy "accepted" value, which was recorded
    // against a notice that described cookie-free, non-personal analytics.
    // That consent cannot carry over to behavioural tracking, so we ask again.
    const existing = readConsent();
    setVisible(existing !== CONSENT_ACCEPTED && existing !== CONSENT_ESSENTIAL);
  }, []);

  function choose(value: typeof CONSENT_ACCEPTED | typeof CONSENT_ESSENTIAL) {
    setConsent(value);
    setVisible(false);
  }

  if (SUPPRESSED_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie and analytics notice"
      className="fixed left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0e0920]/95 px-5 py-4 shadow-2xl backdrop-blur-2xl sm:px-6 sm:py-5"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}
    >
      <p className="text-sm leading-6 text-gray-300">
        We use strictly necessary cookies to keep you signed in. If you accept
        analytics, we also record which pages you visit, how long you spend on
        them, the features you use and any questions you ask the AI mentor —
        linked to your account, so we can see where people get stuck and fix it.{" "}
        <Link
          href="/privacy"
          className="font-semibold text-purple-300 underline-offset-2 hover:underline"
        >
          Privacy policy
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={() => choose(CONSENT_ACCEPTED)}
          className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2 text-[13px] font-bold text-white shadow-lg transition hover:scale-[1.03]"
        >
          Accept analytics
        </button>
        <button
          onClick={() => choose(CONSENT_ESSENTIAL)}
          className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-2 text-[13px] font-bold text-white transition hover:bg-white/[0.12]"
        >
          Essential only
        </button>
        <Link
          href="/privacy"
          className="text-[13px] text-gray-400 transition hover:text-gray-200"
        >
          How we use your data
        </Link>
      </div>
    </div>
  );
}
