import Link from "next/link";
import { Fragment } from "react";
import { ThemeSelector } from "@/app/components/ThemeSelector";

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
 *
 * Icons are inline SVGs (not emoji) so they render crisply and on-brand on every
 * platform — Windows in particular shows flag emoji as plain letters and the
 * robot emoji as a toy. The shared brand tint keeps the row looking premium.
 */

type IconProps = { className?: string };

/** Shield + tick — "your data is never sold". */
function ShieldIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3l7 2.5v5.2c0 4.4-3 7.6-7 9.3-4-1.7-7-4.9-7-9.3V5.5L12 3z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  );
}

/** AI spark — the modern "AI" mark: a four-point star with a small companion. */
function AiSparkIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.4l1.75 4.85L18.6 9l-4.85 1.75L12 15.6l-1.75-4.85L5.4 9l4.85-1.75z" />
      <path d="M18.4 13.6l.78 2.17 2.17.78-2.17.78-.78 2.17-.78-2.17-2.17-.78 2.17-.78z" />
    </svg>
  );
}

/** Location pin — "stored in the UK". */
function PinIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 21s6.5-4.7 6.5-10.5A6.5 6.5 0 1 0 5.5 10.5C5.5 16.3 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.4" />
    </svg>
  );
}

const items = [
  { Icon: ShieldIcon, text: "Your data is never sold" },
  { Icon: AiSparkIcon, text: "Not used to train AI" },
  { Icon: PinIcon, text: "Stored in the UK" },
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
      // Blended, not banded: no border and no own background, so the strip
      // floats on the page atmosphere exactly like the signed-in header does.
      // An <aside> landmark, not a bare div: it sits above <header>/<main>,
      // and content outside any landmark fails axe's region rule on every
      // page that renders it.
      <aside aria-label="Data protection commitments" className="relative z-50">
        {/* Phones: one tappable line. The full four-part strip wraps to two
            lines on a phone, which is a lot of chrome before any content, so
            below sm the copy abbreviates and the whole line links to the
            privacy page — a far bigger tap target than the old 12px link. */}
        <Link
          href="/privacy"
          className="flex items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 sm:hidden"
        >
          <ShieldIcon className="h-3 w-3 shrink-0 text-purple-300" />
          <span className="text-[11px] font-semibold text-gray-100">
            Your data is protected and never sold
          </span>
          <span className="text-[11px] font-semibold text-purple-300" aria-hidden>
            →
          </span>
        </Link>
        <div className="mx-auto hidden max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 py-2.5 sm:flex sm:px-6">
          {items.map(({ Icon, text }, i) => (
            <Fragment key={text}>
              {i > 0 && (
                <span className="hidden text-purple-400/25 sm:inline" aria-hidden>
                  |
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-purple-300" />
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
        {/* Theme selector pinned top-right, above the logo, on wide screens;
            phones keep the footer instance so the strip stays one line. */}
        <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 sm:block">
          <ThemeSelector compact />
        </div>
      </aside>
    );
  }

  /* ── Compact (near CTA) ───────────────────────────────────────────────── */
  if (v === "compact") {
    return (
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] text-gray-400">
        {items.map(({ Icon, text }) => (
          <span key={text} className="flex items-center gap-1">
            <Icon className="h-3 w-3 text-purple-400" />
            <span>{text}</span>
          </span>
        ))}
        <span className="text-gray-700">·</span>
        <Link
          href="/privacy"
          className="text-gray-400 underline-offset-2 hover:text-gray-300 hover:underline"
        >
          How we protect your data →
        </Link>
      </p>
    );
  }

  /* ── Footer (default) ─────────────────────────────────────────────────── */
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {items.map(({ Icon, text }) => (
        <span
          key={text}
          className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[12px] font-semibold text-gray-400"
        >
          <Icon className="h-3 w-3 text-purple-300" />
          <span>{text}</span>
        </span>
      ))}
      <Link
        href="/privacy"
        className="text-[12px] text-gray-400 underline-offset-2 hover:text-gray-300 hover:underline"
      >
        How we protect your data →
      </Link>
    </div>
  );
}
