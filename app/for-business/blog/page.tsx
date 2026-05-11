import type { Metadata } from "next";
import { getAllPosts } from "@/app/lib/content";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { BlogPageContent } from "@/app/components/pages/BlogPageContent";

export const metadata: Metadata = {
  title: "Interview Guides & Career Advice | AI Career Mentor",
};

export default function BusinessBlogPage() {
  const posts = getAllPosts();
  return (
    <AudienceShell audience="business" currentPath="/for-business/blog">
      <BlogPageContent posts={posts} />
    </AudienceShell>
  );
}
