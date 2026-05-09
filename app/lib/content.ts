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

export function getAllPosts(): ContentMeta[] {
  return readDir("blog")
    .map((f) => parseFile("blog", f))
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export function getPost(slug: string): ContentItem | null {
  const filePath = path.join(contentDir, "blog", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return { slug, ...(data as Omit<ContentMeta, "slug">), source: content };
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
