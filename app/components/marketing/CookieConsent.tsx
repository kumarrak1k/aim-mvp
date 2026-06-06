"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "aim_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // Private browsing — don't show
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0e0920]/95 px-5 py-4 shadow-2xl backdrop-blur-2xl sm:px-6 sm:py-5"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}
    >
      <p className="text-sm leading-6 text-gray-300">
        We use strictly necessary cookies for sign-in (Clerk auth). Our
        analytics are cookie-free and collect no personal data.{" "}
        <Link
          href="/privacy"
          className="font-semibold text-purple-300 underline-offset-2 hover:underline"
        >
          Privacy policy
        </Link>
      </p>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={dismiss}
          aria-label="Accept and dismiss cookie notice"
          className="rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-2 text-[13px] font-black text-white shadow-lg transition hover:scale-[1.03]"
        >
          Got it
        </button>
        <Link
          href="/privacy"
          className="text-[13px] text-gray-400 transition hover:text-gray-200"
        >
          Learn more about cookies
        </Link>
      </div>
    </div>
  );
}
