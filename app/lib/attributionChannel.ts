/**
 * Pure attribution helpers shared by the client capture component, the
 * signup API routes, and the admin dashboard. No server-only imports —
 * this file must stay importable from "use client" components.
 */

export type SignupAttribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  promoCode: string | null;
  referrer: string | null;
  landingPath: string | null;
};

const cleanField = (value: unknown, max = 300): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

export type DeviceType = "mobile" | "tablet" | "desktop";

/**
 * Classify the signup device from the User-Agent string. Derived server-side
 * from the request header (trusted, not client-supplied), so it can tell how
 * people are reaching signup — laptop/desktop vs phone vs tablet.
 *
 * Known limitation: iPadOS Safari reports a desktop (Macintosh) UA by default,
 * so some iPads count as "desktop". Tablet detection therefore catches Android
 * tablets and older iPads but not modern iPads in default mode.
 */
export function classifyDevice(userAgent: string | null | undefined): DeviceType | null {
  if (!userAgent) return null;
  const s = userAgent.toLowerCase();
  if (/ipad|tablet|kindle|silk|playbook|nexus (7|9|10)/.test(s)) return "tablet";
  if (/android/.test(s) && !/mobile/.test(s)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|bb10|windows phone|iemobile|webos|opera mini/.test(s)) {
    return "mobile";
  }
  return "desktop";
}

/** Validate/trim an attribution object arriving from the client. */
export function sanitizeAttribution(raw: unknown): SignupAttribution | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const attr: SignupAttribution = {
    utmSource: cleanField(r.utmSource, 120),
    utmMedium: cleanField(r.utmMedium, 120),
    utmCampaign: cleanField(r.utmCampaign, 120),
    promoCode: cleanField(r.promoCode, 60),
    referrer: cleanField(r.referrer, 500),
    landingPath: cleanField(r.landingPath, 300),
  };
  const hasAny = Object.values(attr).some((v) => v !== null);
  return hasAny ? attr : null;
}

const SEARCH_ENGINES = ["google.", "bing.com", "duckduckgo.com", "search.yahoo.", "ecosia.org"];
const SOCIAL_HOSTS: Array<[string, string]> = [
  ["linkedin.com", "linkedin"],
  ["lnkd.in", "linkedin"],
  ["tiktok.com", "tiktok"],
  ["instagram.com", "instagram"],
  ["facebook.com", "facebook"],
  ["reddit.com", "reddit"],
  ["twitter.com", "x / twitter"],
  ["x.com", "x / twitter"],
  ["t.co", "x / twitter"],
  ["youtube.com", "youtube"],
  ["thestudentroom.co.uk", "the student room"],
  ["whatsapp.com", "whatsapp"],
];

/**
 * One human-readable acquisition channel per user, in priority order:
 * explicit UTM tags → promo code → classified referrer → direct/unknown.
 */
export function deriveChannel(u: {
  utmSource?: string | null;
  utmMedium?: string | null;
  promoCode?: string | null;
  referrer?: string | null;
}): string {
  if (u.utmSource) {
    const src = u.utmSource.toLowerCase();
    return u.utmMedium ? `${src} / ${u.utmMedium.toLowerCase()}` : src;
  }
  if (u.promoCode) return `promo: ${u.promoCode.toUpperCase()}`;
  if (u.referrer) {
    try {
      const host = new URL(u.referrer).hostname.replace(/^www\./, "").toLowerCase();
      for (const [needle, label] of SOCIAL_HOSTS) {
        if (host === needle || host.endsWith(`.${needle}`)) return label;
      }
      if (SEARCH_ENGINES.some((s) => host.includes(s.replace(/\.$/, "")))) {
        return "organic search";
      }
      return host;
    } catch {
      return "referral";
    }
  }
  return "direct / unknown";
}
