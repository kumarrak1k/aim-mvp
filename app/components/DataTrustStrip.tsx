import Link from "next/link";

/**
 * A compact, factual data-trust reassurance strip.
 *
 * Based on current vendor commitments:
 *   - Anthropic (Claude API): does not train on API inputs/outputs by default.
 *   - OpenAI (Whisper): does not train on API inputs/outputs by default.
 *   - No vendor sells your data to third parties.
 *   - Database (Neon / AWS eu-west-2): stored in the UK.
 *
 * compact=true  → single row of small pills (for use near CTAs / start buttons)
 * compact=false → slightly larger, centred layout (for hero sections / footer)
 */
export function DataTrustStrip({ compact = false }: { compact?: boolean }) {
  const items = [
    { icon: "🔒", text: "Your data is never sold" },
    { icon: "🤖", text: "Not used to train AI" },
    { icon: "🇬🇧", text: "Stored in the UK" },
  ];

  if (compact) {
    return (
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
        {items.map(({ icon, text }) => (
          <span key={text} className="flex items-center gap-1">
            <span>{icon}</span>
            <span>{text}</span>
          </span>
        ))}
        <span className="text-gray-600">·</span>
        <Link
          href="/privacy"
          className="text-gray-500 underline-offset-2 hover:text-gray-300 hover:underline"
        >
          How we protect your data →
        </Link>
      </p>
    );
  }

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
