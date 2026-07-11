import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content");

export type ContentMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  keywords: string[];
  category?: string;
  readingTime?: string;
  /** Optional per-post OG image path relative to /public (e.g. "/blog/og/my-post.jpg") */
  image?: string;
};

export type ContentItem = ContentMeta & {
  source: string;
};

function readDir(subdir: string): string[] {
  const dir = path.join(contentDir, subdir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
}

function parseFile(subdir: string, filename: string): ContentMeta {
  const slug = filename.replace(".mdx", "");
  const raw = fs.readFileSync(
    path.join(contentDir, subdir, filename),
    "utf8"
  );
  const { data } = matter(raw);
  return { slug, ...(data as Omit<ContentMeta, "slug">) };
}

/**
 * Posts dated in the future are scheduled, not published: they stay out of
 * every listing, the sitemap and static params until their date arrives.
 * Combined with ISR revalidation on the blog pages, this lets a queue of
 * pre-written posts go live automatically, one per week, with no redeploy.
 */
function isPublished(meta: Pick<ContentMeta, "date">): boolean {
  return new Date(meta.date).getTime() <= Date.now();
}

export function getAllPosts(): ContentMeta[] {
  return readDir("blog")
    .map((f) => parseFile("blog", f))
    .filter(isPublished)
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export function getPost(slug: string): ContentItem | null {
  const filePath = path.join(contentDir, "blog", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const item = { slug, ...(data as Omit<ContentMeta, "slug">), source: content };
  // A scheduled post is a 404 until its publish date arrives.
  if (!isPublished(item)) return null;
  return item;
}

export function getAllQuestionSets(): ContentMeta[] {
  return readDir("questions")
    .map((f) => parseFile("questions", f))
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export function getQuestionSet(slug: string): ContentItem | null {
  const filePath = path.join(contentDir, "questions", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return { slug, ...(data as Omit<ContentMeta, "slug">), source: content };
}

// ── Related-content selection ─────────────────────────────────────────
// Deterministic helpers used by the "Keep preparing" internal-linking
// sections on blog posts and question-bank pages. Matching is based on
// significant-word overlap between titles/keywords (generic interview
// vocabulary is excluded so shared words actually signal a shared topic),
// with ties broken by date then slug so output never changes between builds.

const RELATED_STOP_WORDS = new Set([
  "and",
  "answer",
  "answers",
  "are",
  "ask",
  "best",
  "common",
  "for",
  "from",
  "guide",
  "how",
  "interview",
  "interviews",
  "job",
  "model",
  "most",
  "not",
  "questions",
  "the",
  "tips",
  "top",
  "what",
  "when",
  "where",
  "why",
  "with",
  "you",
  "your",
]);

function significantWords(...sources: Array<string | string[] | undefined>): Set<string> {
  const words = new Set<string>();
  for (const source of sources) {
    if (!source) continue;
    const text = Array.isArray(source) ? source.join(" ") : source;
    for (const word of text.toLowerCase().split(/[^a-z0-9]+/)) {
      if (word.length >= 3 && !RELATED_STOP_WORDS.has(word)) words.add(word);
    }
  }
  return words;
}

function overlapCount(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const word of a) if (b.has(word)) count++;
  return count;
}

/**
 * Up to `limit` blog posts related to the given post or question set,
 * scored by keyword/title overlap plus a same-category bonus. When fewer
 * than `limit` posts share a topic, the list is topped up with the most
 * recent posts so callers always get `limit` results.
 */
export function getRelatedPosts(meta: ContentMeta, limit = 2): ContentMeta[] {
  const candidates = getAllPosts().filter((p) => p.slug !== meta.slug);
  const target = significantWords(meta.title, meta.keywords);

  const scored = candidates
    .map((post) => ({
      post,
      score:
        overlapCount(target, significantWords(post.title, post.keywords)) +
        (meta.category && post.category === meta.category ? 2 : 0),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.post.date).getTime() - new Date(a.post.date).getTime() ||
        a.post.slug.localeCompare(b.post.slug)
    );

  const related = scored
    .filter((entry) => entry.score > 0)
    .slice(0, limit)
    .map((entry) => entry.post);

  // Top up with the most recent posts (candidates are already date-sorted).
  for (const post of candidates) {
    if (related.length >= limit) break;
    if (!related.some((p) => p.slug === post.slug)) related.push(post);
  }

  return related;
}

/**
 * The single question-bank page most related to a blog post: matched when
 * any significant word from the post title appears in a question set's
 * slug or title. Returns null when nothing genuinely matches.
 */
export function getRelatedQuestionSet(post: ContentMeta): ContentMeta | null {
  const target = significantWords(post.title);

  const scored = getAllQuestionSets()
    .map((set) => ({
      set,
      score: overlapCount(
        target,
        significantWords(set.title, set.slug.replace(/-/g, " "))
      ),
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.set.slug.localeCompare(b.set.slug)
    );

  return scored[0]?.set ?? null;
}
