import Link from "next/link";

/**
 * The four universal resource links, shown in a single row. Used on pages that
 * don't carry a full app-shell header (auth pages, homepage mobile strip) so
 * these are reachable from every page.
 */
export const RESOURCE_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/blog", label: "Interview guides" },
  { href: "/questions", label: "Question library" },
  { href: "/tools/star-scorer", label: "Free STAR scorer" },
] as const;

export function ResourceLinksRow({
  className = "",
  scroll = false,
  pill = false,
}: {
  className?: string;
  /** Horizontal-scroll variant for narrow (mobile) headers. */
  scroll?: boolean;
  /** Render inside a rounded pill nav, matching the homepage/marketing header. */
  pill?: boolean;
}) {
  // Pill variant — visually identical to the homepage's centred nav pill.
  if (pill) {
    return (
      <div className={`flex justify-center ${className}`}>
        <nav
          className="flex items-center gap-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] p-1"
          aria-label="Resources"
        >
          {RESOURCE_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] font-bold text-gray-400 transition hover:bg-white/[0.07] hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <nav
      className={`flex items-center gap-x-5 gap-y-2 ${
        scroll
          ? "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex-wrap justify-center"
      } ${className}`}
      aria-label="Resources"
    >
      {RESOURCE_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="whitespace-nowrap text-[12px] font-semibold text-gray-400 transition hover:text-white"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
