"use client";

import { useEffect, useState } from "react";

/**
 * Three-option colour-theme selector (System / Light / Dark) following the
 * light-dark-mode accessibility spec: native buttons with aria-pressed, all
 * options visible at once, theme changes only on explicit activation — never
 * on focus or hover. The stored value is the user's MODE (system stays
 * "system", it is never collapsed to the resolved theme), and the resolved
 * light/dark lands on <html data-theme> where globals.css picks it up.
 *
 * Site default is dark (brand), applied by the root layout's inline script;
 * this component only ever changes it on a click.
 */

type ThemeMode = "system" | "light" | "dark";
const STORAGE_KEY = "theme-mode";
const MODES: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function resolve(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function apply(mode: ThemeMode) {
  const el = document.documentElement;
  el.setAttribute("data-theme-mode", mode);
  el.setAttribute("data-theme", resolve(mode));
}

export function ThemeSelector() {
  // Server renders no selection highlight; the real mode arrives after mount
  // (it lives in localStorage, which the server can't see).
  const [mode, setMode] = useState<ThemeMode | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage unavailable — selector still works for this page */
    }
    setMode(stored === "light" || stored === "dark" || stored === "system" ? stored : "dark");
  }, []);

  // While System is active, follow OS changes live without touching the
  // stored mode.
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  function choose(next: ThemeMode) {
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* still applies for the current page */
    }
    apply(next);
  }

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.04] p-1"
    >
      {MODES.map((m) => {
        const selected = mode === m.value;
        return (
          <button
            key={m.value}
            type="button"
            aria-pressed={selected}
            onClick={() => choose(m.value)}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-xs transition ${
              selected
                ? "border border-purple-400/60 bg-purple-500/[0.14] font-bold text-white"
                : "border border-transparent font-semibold text-gray-400 hover:text-white"
            }`}
          >
            {m.value === "system" && (
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="14" height="14">
                <path fill="none" stroke="currentColor" strokeWidth="2" d="M3 5h18v12H3zM9 21h6" />
              </svg>
            )}
            {m.value === "light" && (
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="14" height="14">
                <circle cx="12" cy="12" r="4" fill="currentColor" />
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
              </svg>
            )}
            {m.value === "dark" && (
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
            <span>{m.label}</span>
            {selected && (
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="12" height="12">
                <path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
