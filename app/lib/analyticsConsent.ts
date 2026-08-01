/**
 * Analytics consent gate.
 *
 * Behavioural telemetry records page journeys, dwell time and AI-mentor
 * questions against a named account. That is not strictly necessary to deliver
 * the service, so under UK GDPR / PECR it needs freely given consent with a
 * genuine option to refuse — a notice-only banner is not enough.
 *
 * Default is DENIED: tracking starts only after an explicit accept. Treating
 * silence as consent is exactly the pattern the rules exist to prevent.
 */

export const CONSENT_KEY = "aim_cookie_consent";
export const CONSENT_ACCEPTED = "analytics";
export const CONSENT_ESSENTIAL = "essential";

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === CONSENT_ACCEPTED;
  } catch {
    // Storage unavailable — we cannot evidence consent, so we do not track.
    return false;
  }
}

export function readConsent(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function setConsent(value: typeof CONSENT_ACCEPTED | typeof CONSENT_ESSENTIAL) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new CustomEvent("aim-consent-change", { detail: value }));
  } catch {
    // Nothing to do — the gate fails closed.
  }
}
