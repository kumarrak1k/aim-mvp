import Link from "next/link";

export type RelatedContentItem = {
  href: string;
  /** Small uppercase label above the title, e.g. "Guide" or "Free tool". */
  eyebrow: string;
  title: string;
  description: string;
};

/**
 * "Keep preparing" internal-linking section shown after long-form content
 * (blog posts and question-bank pages). Renders up to 4 link cards in a
 * responsive grid, matching the site's standard card styling.
 */
export function RelatedContent({ items }: { items: RelatedContentItem[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-label="Related content" className="mt-14 border-t border-white/[0.07] pt-10">
      <h2 className="mb-6 text-2xl font-bold tracking-tight">
        Keep preparing
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-purple-400/30 hover:bg-white/[0.07]"
          >
            <p className="mb-2 text-[12px] font-bold tracking-wide text-purple-300/70">
              {item.eyebrow}
            </p>
            <p className="font-bold leading-snug text-white transition group-hover:text-purple-200">
              {item.title}
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-400">
              {item.description}
            </p>
            <span className="mt-auto pt-3 text-sm text-gray-400 transition group-hover:text-purple-300">
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
