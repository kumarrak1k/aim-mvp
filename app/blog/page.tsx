import type { Metadata } from "next";
import { getAllPosts } from "@/app/lib/content";
import { absoluteUrl } from "@/app/config/site";
import { PublicShell } from "@/app/components/marketing/PublicShell";
import { BlogPageContent } from "@/app/components/pages/BlogPageContent";

export const metadata: Metadata = {
  title: { absolute: "Interview Guides & Career Advice | AI Career Mentor" },
  description:
    "In-depth guides on interview technique, competency frameworks, assessment centres, and career preparation — written by the AI Career Mentor team.",
  alternates: { canonical: absoluteUrl("/blog") },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <PublicShell currentPath="/blog">
      <BlogPageContent posts={posts} />
    </PublicShell>
  );
}
