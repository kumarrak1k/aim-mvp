/**
 * Shared UI primitives used across all marketing and authed pages.
 *
 * Previously these lived inside MarketingShell.tsx alongside the (now
 * retired) shared shell. Pulled out so the primitives can survive the
 * MarketingShell deletion and be imported from a stable, neutral path.
 *
 * Audience-specific shells (CandidateAppShell, CorporateAppShell,
 * AudienceShell, NeutralShell) compose these primitives.
 */

import Link from "next/link";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      {eyebrow && (
        <p className="mb-3 text-[12px] font-bold tracking-wide text-purple-300/90">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-4xl">
        {title}
      </h2>
      {description && (
        <p
          className={`mt-5 text-base leading-8 text-gray-400 ${
            align === "center" ? "mx-auto max-w-3xl" : "max-w-2xl"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border border-white/[0.09] bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 text-sm leading-7 text-gray-300 sm:text-base"
        >
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

type PageLinkCardProps = {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
};

export function PageLinkCard({
  href,
  eyebrow,
  title,
  description,
  image,
}: PageLinkCardProps) {
  return (
    <Link href={href} className="block">
      <div className="group h-full overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-white/[0.04] shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.06]">
        <div className="aspect-[16/10] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
          />
        </div>
        <div className="p-6">
          <p className="mb-2 text-[12px] font-bold tracking-wide text-cyan-300/90">
            {eyebrow}
          </p>
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-gray-400">{description}</p>
          <p className="mt-4 text-xs font-bold text-purple-300/80 transition group-hover:text-purple-200">
            Explore →
          </p>
        </div>
      </div>
    </Link>
  );
}
