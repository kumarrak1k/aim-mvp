"use client";

import { useEffect, useMemo, useState } from "react";

export function useDeviceProfile() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isAppleMobileDevice, setIsAppleMobileDevice] = useState(false);
  const [hasFinePointer, setHasFinePointer] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateDeviceProfile = () => {
      const userAgent = window.navigator.userAgent || "";
      const touchPoints = window.navigator.maxTouchPoints || 0;
      const isAppleTouch =
        /iPad|iPhone|iPod/i.test(userAgent) ||
        (window.navigator.platform === "MacIntel" && touchPoints > 1);

      setIsTouchDevice(
        touchPoints > 0 ||
          window.matchMedia("(pointer: coarse)").matches ||
          "ontouchstart" in window
      );
      setIsSmallScreen(window.matchMedia("(max-width: 767px)").matches);
      setIsAppleMobileDevice(isAppleTouch);
      // ANY fine pointer (mouse/trackpad) present means this is a computer,
      // not a tablet. "(pointer: fine)" checked only the PRIMARY pointer,
      // and some Windows touch laptops (Edge especially) report the
      // touchscreen as primary — which wrongly put real laptops into the
      // tablet guided flow. A genuine iPad/Android tablet with no mouse
      // attached still fails "(any-pointer: fine)".
      setHasFinePointer(window.matchMedia("(any-pointer: fine)").matches);
    };

    updateDeviceProfile();
    window.addEventListener("resize", updateDeviceProfile);

    return () => {
      window.removeEventListener("resize", updateDeviceProfile);
    };
  }, []);

  // Phone: small screen (≤767px) — full manual mode, no auto-play
  const isPhone = useMemo(() => isSmallScreen, [isSmallScreen]);

  // Tablet: large touch screen whose PRIMARY input is touch (iPad, Android
  // tablet, Surface in tablet mode). Touchscreen laptops report a fine
  // primary pointer and are treated as computers. Apple mobile devices are
  // always tablets here regardless of pointer reporting.
  // Auto-play is allowed (user gesture on "Start interview" unlocks iOS audio)
  // but camera still requires a manual tap for the permission prompt.
  const isTablet = useMemo(
    () =>
      !isSmallScreen &&
      (isAppleMobileDevice || (isTouchDevice && !hasFinePointer)),
    [hasFinePointer, isAppleMobileDevice, isSmallScreen, isTouchDevice]
  );

  // manualDeviceMode = phones only. Disables auto-play entirely and skips
  // primeAudioInput (no reliable gesture chain on phones).
  const manualDeviceMode = useMemo(() => isPhone, [isPhone]);

  return {
    isTouchDevice,
    isSmallScreen,
    isAppleMobileDevice,
    isPhone,
    isTablet,
    manualDeviceMode,
  };
}
