import Link from "next/link";
import { Fragment } from "react";

/**
 * Data-trust reassurance strip in three variants:
 *
 *   topbar  — full-width announcement bar pinned to the very top of the page.
 *              High-contrast background so it pops against the dark site bg.
 *   compact — single inline pill row for use near Start/CTA buttons.
 *   footer  — subtle badge row for the site footer.
 *
 * Copy is factually accurate per vendor policies:
 *   OpenAI (API + Whisper) — does not train on API inputs/outputs by default.
 *   Neon / AWS eu-west-2   — data stored in London, UK.
 *   No vendor sells user data to third parties.
 */

const items = [
  { icon: "🔒", text: "Your data is never sold" },
  { icon: "🤖", text: "Not used to train AI" },
  { icon: "🇬🇧", text: "Stored in the UK" },
] as const;

type Variant = "topbar" | "compact" | "footer";

export function DataTrustStrip({
  variant = "footer",
  // legacy prop kept for backward compat
  compact,
}: {
  variant?: Variant;
  compact?: boolean;
}) {
  const v: Variant = compact ? "compact" : variant;

  /* ── Top bar ──────────────────────────────────────────────────────────── */
  if (v === "topbar") {
    return (
      <div className="relative z-50 border-b border-purple-600/25 bg-[#170c2e]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 py-2.5 sm:px-6">
          {items.map(({ icon, text }, i) => (
            <Fragment key={text}>
              {i > 0 && (
                <span className="hidden text-purple-400/25 sm:inline" aria-hidden>
                  |
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="text-[13px]">{icon}</span>
                <span className="text-[12px] font-semibold text-gray-100">
                  {text}
                </span>
              </span>
            </Fragment>
          ))}
          <span className="hidden text-purple-400/25 sm:inline" aria-hidden>|</span>
          <Link
            href="/privacy"
            className="text-[12px] font-semibold text-purple-300 underline-offset-2 transition hover:text-white hover:underline"
          >
            How we protect your data →
          </Link>
        </div>
      </div>
    );
  }

  /* ── Compact (near CTA) ───────────────────────────────────────────────── */
  if (v === "compact") {
    return (
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
        {items.map(({ icon, text }) => (
          <span key={text} className="flex items-center gap-1">
            <span>{icon}</span>
            <span>{text}</span>
          </span>
        ))}
        <span className="text-gray-700">·</span>
        <Link
          href="/privacy"
          className="text-gray-500 underline-offset-2 hover:text-gray-300 hover:underline"
        >
          How we protect your data →
        </Link>
      </p>
    );
  }

  /* ── Footer (default) ─────────────────────────────────────────────────── */
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {items.map(({ icon, text }) => (
        <span
          key={text}
          className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-gray-400"
        >
          <span>{icon}</span>
          <span>{text}</span>
        </span>
      ))}
      <Link
        href="/privacy"
        className="text-[11px] text-gray-500 underline-offset-2 hover:text-gray-300 hover:underline"
      >
        How we protect your data →
      </Link>
    </div>
  );
}
