import Link from "next/link";

/**
 * The free-trial CTA pill, shown site-wide on marketing pages. Audience-aware:
 *   candidate → 7-day Plus trial        → /for-candidates/sign-up
 *   business  → 14-day Team trial      → /for-business/sign-up
 *
 * Server-safe (just a Link) so it can be dropped into any shell or page.
 */
export function TrialBadge({
  audience = "candidate",
  className = "",
}: {
  audience?: "candidate" | "business";
  className?: string;
}) {
  if (audience === "business") {
    return (
      <Link
        href="/for-business/sign-up"
        className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-5 py-2.5 text-[12px] font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-fuchsia-900/40 transition hover:scale-[1.03] ${className}`}
      >
        <span className="text-sm" aria-hidden>✨</span>
        Team plan free for 14 days · no card
      </Link>
    );
  }

  return (
    <Link
      href="/for-candidates/sign-up"
      className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-2.5 text-[12px] font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-purple-900/40 transition hover:scale-[1.03] ${className}`}
    >
      <span className="text-sm" aria-hidden>✨</span>
      7-day Plus trial · no card
    </Link>
  );
}
