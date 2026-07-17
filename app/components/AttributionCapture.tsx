"use client";

import { useEffect } from "react";

const STORAGE_KEY = "aim_attribution";

/**
 * First-touch acquisition capture. Mounted once in the root layout: on the
 * visitor's first page load it snapshots the UTM tags, promo code, referrer
 * and landing path into localStorage. The snapshot is never overwritten, and
 * the sign-up completion / accept-terms calls send it to the server where it
 * is stored against the new account (see app/lib/attribution.ts).
 *
 * Renders nothing and never throws — attribution must not affect the app.
 */
export function AttributionCapture() {
  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY)) return; // first touch only

      const params = new URLSearchParams(window.location.search);

      // Internal navigation (same-host referrer) is not an acquisition source.
      let referrer: string | null = document.referrer || null;
      if (referrer) {
        try {
          if (new URL(referrer).host === window.location.host) referrer = null;
        } catch {
          referrer = null;
        }
      }

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          utmSource: params.get("utm_source"),
          utmMedium: params.get("utm_medium"),
          utmCampaign: params.get("utm_campaign"),
          promoCode: params.get("promo"),
          referrer,
          landingPath: window.location.pathname,
        })
      );
    } catch {
      // Storage unavailable (private mode etc.) — attribution is best-effort.
    }
  }, []);

  return null;
}

/** Read the stored first-touch snapshot for inclusion in a signup API call. */
export function readStoredAttribution(): Record<string, unknown> | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Promotion code for checkout pre-apply. Prefers the pricing page's
 * same-tab capture (sessionStorage "aim_promo"), then falls back to the
 * first-touch snapshot — so a ?promo= link on ANY page carries the code
 * through to checkout, even in a later visit or new tab.
 */
export function readStoredPromoCode(): string | undefined {
  try {
    const session = window.sessionStorage.getItem("aim_promo");
    if (session) return session;
    const attr = readStoredAttribution();
    const promo = attr?.promoCode;
    return typeof promo === "string" && promo.trim()
      ? promo.trim().toUpperCase()
      : undefined;
  } catch {
    return undefined;
  }
}
