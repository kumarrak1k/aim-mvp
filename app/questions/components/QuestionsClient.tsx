"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ContentMeta } from "@/app/lib/content";

const CATEGORIES = [
  "All",
  "By role",
  "By competency",
  "By industry",
  "By interview type",
  "By candidate type",
];

type Props = { sets: ContentMeta[] };

export function QuestionsClient({ sets }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sets.filter((set) => {
      const matchesCategory =
        activeCategory === "All" || set.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        set.title.toLowerCase().includes(q) ||
        (set.description ?? "").toLowerCase().includes(q) ||
        (set.keywords ?? []).some((k) => k.toLowerCase().includes(q)) ||
        (set.category ?? "").toLowerCase().includes(q)
      );
    });
  }, [sets, search, activeCategory]);

  const clearAll = () => {
    setSearch("");
    setActiveCategory("All");
  };

  const hasFilter = search.trim() !== "" || activeCategory !== "All";

  return (
    <>
      {/* ── Search bar ── */}
      <div className="relative mb-5">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
          <svg
            className="h-4.5 w-4.5 text-gray-400"
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by role, skill, or keyword, e.g. product manager, STAR, leadership…"
          className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] py-4 pl-11 pr-12 text-sm text-white placeholder:text-gray-400 focus:border-purple-400/40 focus:bg-white/[0.06] focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute inset-y-0 right-4 flex items-center text-gray-400 transition hover:text-white"
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Category filter pills ── */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
              activeCategory === cat
                ? "border-purple-400/50 bg-purple-400/[0.14] text-purple-200 shadow-sm"
                : "border-white/[0.08] bg-white/[0.03] text-gray-400 hover:border-white/[0.15] hover:bg-white/[0.07] hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Results meta ── */}
      {hasFilter && (
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            <span className="font-bold text-white">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "question set" : "question sets"} found
          </p>
          <button
            onClick={clearAll}
            className="text-xs font-bold text-gray-400 transition hover:text-white"
          >
            Clear filters ×
          </button>
        </div>
      )}

      {/* ── Results grid ── */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-base font-bold text-gray-300">No results found</p>
          <p className="mt-2 text-sm text-gray-400">
            Try a different keyword or browse all categories.
          </p>
          <button
            onClick={clearAll}
            className="mt-5 rounded-2xl border border-purple-300/20 bg-purple-300/[0.07] px-5 py-2.5 text-sm font-bold text-purple-200 transition hover:bg-purple-300/[0.12]"
          >
            Show all question sets
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((set) => (
            <Link key={set.slug} href={`/questions/${set.slug}`}>
              <article className="group h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition hover:border-purple-300/20 hover:bg-purple-300/[0.05]">
                {set.category && (
                  <p className="mb-2 text-[12px] font-bold tracking-wide text-purple-300/60">
                    {set.category}
                  </p>
                )}
                <h2 className="font-bold leading-tight text-white transition group-hover:text-purple-200">
                  {set.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  {set.description}
                </p>
                <p className="mt-3 text-xs font-semibold text-purple-300 opacity-0 transition group-hover:opacity-100">
                  Read questions →
                </p>
              </article>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
