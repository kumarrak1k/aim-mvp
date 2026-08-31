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
 * Site default is light, applied by the root layout's inline script;
 * this component only ever changes it on a click.
 */

/* Two options only, per product decision (2026-08-30): a System option added
   noise. Default is LIGHT (user decision 2026-08-31); any legacy stored
   "system" value falls back to it. */
type ThemeMode = "light" | "dark";
const STORAGE_KEY = "theme-mode";
const MODES: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function apply(mode: ThemeMode) {
  const el = document.documentElement;
  el.setAttribute("data-theme-mode", mode);
  el.setAttribute("data-theme", mode);
}

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  // React state feeds aria-pressed ONLY. The visible highlight is pure CSS
  // keyed off <html data-theme> (.theme-opt rules in globals.css), which the
  // anti-flash head script sets before first paint — state arrives after
  // hydration, and highlighting from it made the selection visibly jump
  // on every navigation for non-default-theme users.
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage unavailable — selector still works for this page */
    }
    setMode(stored === "light" || stored === "dark" ? stored : "light");
  }, []);

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
        return (
          <button
            key={m.value}
            type="button"
            data-value={m.value}
            aria-pressed={mode === m.value}
            onClick={() => choose(m.value)}
            className={`theme-opt inline-flex items-center gap-1.5 rounded-full transition ${
              compact ? "min-h-[28px] px-2 text-[11px]" : "min-h-[36px] px-3 text-xs"
            }`}
          >
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
            <svg className="theme-opt-check" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="12" height="12">
              <path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
