"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ContentMeta } from "@/app/lib/content";

type Props = { posts: ContentMeta[] };

/**
 * Client-side search + category filtering for the interview-guides list.
 * Mirrors the question-library search (QuestionsClient) so the two browse
 * experiences feel identical. Categories are derived from the posts, so new
 * guide categories appear automatically without touching this file.
 */
export function BlogClient({ posts }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const p of posts) if (p.category) seen.add(p.category);
    return ["All", ...Array.from(seen).sort()];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "All" || post.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        (post.description ?? "").toLowerCase().includes(q) ||
        (post.keywords ?? []).some((k) => k.toLowerCase().includes(q)) ||
        (post.category ?? "").toLowerCase().includes(q)
      );
    });
  }, [posts, search, activeCategory]);

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
          aria-label="Search guides"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guides by topic or keyword, e.g. STAR, assessment centre, salary…"
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
      {categories.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
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
      )}

      {/* ── Results meta ── */}
      {hasFilter && (
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            <span className="font-bold text-white">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "guide" : "guides"} found
          </p>
          <button
            onClick={clearAll}
            className="text-xs font-bold text-gray-400 transition hover:text-white"
          >
            Clear filters ×
          </button>
        </div>
      )}

      {/* ── Results list ── */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-base font-bold text-gray-300">No guides found</p>
          <p className="mt-2 text-sm text-gray-400">
            Try a different keyword or browse all categories.
          </p>
          <button
            onClick={clearAll}
            className="mt-5 rounded-2xl border border-purple-300/20 bg-purple-300/[0.07] px-5 py-2.5 text-sm font-bold text-purple-200 transition hover:bg-purple-300/[0.12]"
          >
            Show all guides
          </button>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.07]">
          {filtered.map((post) => (
            <article key={post.slug} className="group py-8 first:pt-0">
              <Link href={`/blog/${post.slug}`}>
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    {post.category && (
                      <p className="mb-2 text-[12px] font-bold tracking-wide text-purple-300/70">
                        {post.category}
                      </p>
                    )}
                    <h2 className="text-xl font-bold leading-tight tracking-tight transition group-hover:text-purple-200">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      {post.description}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                      {post.readingTime && (
                        <>
                          <span>·</span>
                          <span>{post.readingTime} read</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="mt-1 shrink-0 text-gray-400 transition group-hover:text-purple-300">
                    →
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
