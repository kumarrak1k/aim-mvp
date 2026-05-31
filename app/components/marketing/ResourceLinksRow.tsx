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
}: {
  className?: string;
  /** Horizontal-scroll variant for narrow (mobile) headers. */
  scroll?: boolean;
}) {
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
