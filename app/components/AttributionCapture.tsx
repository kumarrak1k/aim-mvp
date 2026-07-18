"use client";

import { useEffect } from "react";

const STORAGE_KEY = "aim_attribution";
const PROMO_KEY = "aim_promo_saved";
/** A first touch older than this no longer explains a signup. */
const MAX_AGE_DAYS = 90;

/**
 * First-touch acquisition capture. Mounted once in the root layout: on the
 * visitor's first page load it snapshots the UTM tags, promo code, referrer
 * and landing path into localStorage. The snapshot is not overwritten by
 * later visits, and the sign-up completion / accept-terms calls send it to
 * the server where it is stored against the new account (see
 * app/lib/attribution.ts). It is CONSUMED (cleared) once a signup has
 * persisted it — a second account created from the same browser gets its
 * own first touch, not a stale one.
 *
 * Renders nothing and never throws — attribution must not affect the app.
 */
export function AttributionCapture() {
  useEffect(() => {
    try {
      if (readStoredAttribution()) return; // first touch only (expired ones fall through)

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
          capturedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Storage unavailable (private mode etc.) — attribution is best-effort.
    }
  }, []);

  return null;
}

/**
 * Read the stored first-touch snapshot for inclusion in a signup API call.
 * Expired snapshots (older than 90 days) are dropped — a months-old visit
 * doesn't explain today's signup.
 */
export function readStoredAttribution(): Record<string, unknown> | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const attr = JSON.parse(raw) as Record<string, unknown>;
    const capturedAt =
      typeof attr.capturedAt === "string" ? Date.parse(attr.capturedAt) : NaN;
    if (
      Number.isFinite(capturedAt) &&
      Date.now() - capturedAt > MAX_AGE_DAYS * 24 * 60 * 60 * 1000
    ) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return attr;
  } catch {
    return null;
  }
}

/**
 * Consume the first-touch snapshot after a signup has successfully persisted
 * it. The promo code (if any) is kept separately so it can still pre-apply
 * at a later checkout — but it no longer attaches to future accounts'
 * attribution from this browser.
 */
export function clearStoredAttribution(): void {
  try {
    const attr = readStoredAttribution();
    const promo = attr?.promoCode;
    if (typeof promo === "string" && promo.trim()) {
      window.localStorage.setItem(PROMO_KEY, promo.trim().toUpperCase());
    }
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort.
  }
}

/**
 * Promotion code for checkout pre-apply. Prefers the pricing page's
 * same-tab capture (sessionStorage "aim_promo"), then the promo preserved
 * from a consumed snapshot, then the live first-touch snapshot — so a
 * ?promo= link on ANY page carries the code through to checkout, even in a
 * later visit or new tab.
 */
export function readStoredPromoCode(): string | undefined {
  try {
    const session = window.sessionStorage.getItem("aim_promo");
    if (session) return session;
    const saved = window.localStorage.getItem(PROMO_KEY);
    if (saved) return saved;
    const attr = readStoredAttribution();
    const promo = attr?.promoCode;
    return typeof promo === "string" && promo.trim()
      ? promo.trim().toUpperCase()
      : undefined;
  } catch {
    return undefined;
  }
}
