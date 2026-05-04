"use client";

import { useEffect, useMemo, useState } from "react";

export function useDeviceProfile() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isAppleMobileDevice, setIsAppleMobileDevice] = useState(false);

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
    };

    updateDeviceProfile();
    window.addEventListener("resize", updateDeviceProfile);

    return () => {
      window.removeEventListener("resize", updateDeviceProfile);
    };
  }, []);

  const manualDeviceMode = useMemo(() => {
    return isTouchDevice || isSmallScreen || isAppleMobileDevice;
  }, [isTouchDevice, isSmallScreen, isAppleMobileDevice]);

  return {
    isTouchDevice,
    isSmallScreen,
    isAppleMobileDevice,
    manualDeviceMode,
  };
}
