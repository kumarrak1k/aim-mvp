import type { Metadata } from "next";
import { getAllPosts } from "@/app/lib/content";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";
import { BlogPageContent } from "@/app/components/pages/BlogPageContent";

export const metadata: Metadata = {
  title: { absolute: "Interview Guides & Career Advice | AI Career Mentor" },
};

export default async function CandidateBlogPage() {
  const posts = getAllPosts();

  return (
    <CandidateShell currentPath="/for-candidates/blog">
      <BlogPageContent posts={posts} />
    </CandidateShell>
  );
}
