import { useEffect, useState } from "react";

/**
 * True on iPad specifically — used to correct the front-camera framing, which
 * is ultra-wide on iPads (the candidate looks far away at the same preview
 * size) but normal on iPhones and laptop webcams.
 *
 * Detection is deliberately iPad-only:
 *  - Modern iPadOS Safari reports a desktop platform ("MacIntel"), so we pair
 *    that with a touch screen (maxTouchPoints > 1) — a real Mac has 0.
 *  - Older iPads still send an explicit "iPad" user-agent.
 *  - iPhones are excluded: their front camera is not ultra-wide, and the user
 *    confirmed phone framing is already correct, so they must stay untouched.
 *
 * Resolves to its real value only after mount, because `navigator` is
 * client-only — starting at `false` keeps SSR and the first client render in
 * agreement (no hydration mismatch), then the effect corrects it on iPad.
 */
export function useIsIpad(): boolean {
  const [isIpad, setIsIpad] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent || "";
    if (/iPhone/.test(ua)) return; // phones already frame correctly
    const ipadUA = /iPad/.test(ua);
    const iPadOSDesktopUA =
      navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    setIsIpad(ipadUA || iPadOSDesktopUA);
  }, []);

  return isIpad;
}
