"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { hasAnalyticsConsent } from "@/app/lib/analyticsConsent";

/**
 * Page-view and dwell-time beacon for signed-in candidates.
 *
 * A "visit" is one sitting: the id lives in sessionStorage, so it survives
 * navigation within a tab and resets when the user comes back later. That
 * single id is what turns a flat event stream into answers — visit count,
 * time on site, the page sequence, and crucially the LAST page of the last
 * visit, which is where the user gave up.
 *
 * Dwell is reported retroactively. A page cannot know how long it was read
 * until the reader leaves, so each view is sent on arrival (so the visit is
 * recorded even if the tab is killed) and the dwell for the PREVIOUS page is
 * attached to the next beacon.
 *
 * Everything here is best-effort and silent: telemetry must never surface an
 * error to the user or delay a navigation.
 */

const VISIT_KEY = "aim_visit_id";
/** A gap longer than this starts a new visit even in the same tab. */
const VISIT_IDLE_MS = 30 * 60 * 1000;
const LAST_SEEN_KEY = "aim_visit_last_seen";

function getVisitId(): string {
  try {
    const now = Date.now();
    const lastSeen = Number(sessionStorage.getItem(LAST_SEEN_KEY) ?? 0);
    const existing = sessionStorage.getItem(VISIT_KEY);
    sessionStorage.setItem(LAST_SEEN_KEY, String(now));

    if (existing && lastSeen && now - lastSeen < VISIT_IDLE_MS) return existing;

    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v_${now}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(VISIT_KEY, fresh);
    return fresh;
  } catch {
    // Private mode / storage disabled — still emit, just without visit grouping.
    return "no-storage";
  }
}

function send(body: Record<string, unknown>, useBeacon = false) {
  // Consent is checked at send time, not at mount: a user who accepts or
  // withdraws mid-session must take effect immediately, without a reload.
  if (!hasAnalyticsConsent()) return;
  try {
    const payload = JSON.stringify(body);
    // sendBeacon survives page unload, where fetch is routinely cancelled.
    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/activity", new Blob([payload], { type: "application/json" }));
      return;
    }
    void fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let telemetry throw into a render or a navigation.
  }
}

export function ActivityTracker() {
  const pathname = usePathname();
  const arrivedAt = useRef<number>(Date.now());
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const visitId = getVisitId();
    const now = Date.now();

    // Attach how long the PREVIOUS page was on screen — see the note above.
    const dwellMs =
      previousPath.current !== null ? Math.max(0, now - arrivedAt.current) : undefined;

    send({
      type: "page_view",
      path: pathname,
      visitId,
      ...(dwellMs !== undefined ? { dwellMs } : {}),
      ...(previousPath.current === null && typeof document !== "undefined" && document.referrer
        ? { referrer: document.referrer.slice(0, 300) }
        : {}),
      ...(typeof document !== "undefined" && document.documentElement.lang
        ? { locale: document.documentElement.lang }
        : {}),
    });

    previousPath.current = pathname;
    arrivedAt.current = now;

    // Final dwell for the last page of the visit — the exit page. Without this
    // the most important page in the whole journey has no duration.
    const flush = () => {
      if (document.visibilityState !== "hidden") return;
      send(
        {
          type: "page_view",
          path: pathname,
          visitId,
          dwellMs: Math.max(0, Date.now() - arrivedAt.current),
        },
        true
      );
    };

    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, [pathname]);

  return null;
}

/**
 * Record a meaningful in-page action (button press, tab switch, doc download).
 * Safe to call from anywhere on the client; no-ops on the server.
 */
export function trackInteraction(
  action: string,
  meta?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;
  send({
    type: "interaction",
    action,
    path: window.location.pathname,
    visitId: getVisitId(),
    ...(meta ? { meta } : {}),
  });
}
