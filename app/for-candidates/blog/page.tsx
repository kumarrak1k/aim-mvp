import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getAllPosts } from "@/app/lib/content";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
import { BlogPageContent } from "@/app/components/pages/BlogPageContent";

export const metadata: Metadata = {
  title: "Interview Guides & Career Advice | AI Career Mentor",
};

export default async function CandidateBlogPage() {
  const { userId } = await auth();
  const posts = getAllPosts();

  if (userId) {
    return (
      <CandidateAppShell currentPath="/for-candidates/blog">
        <BlogPageContent posts={posts} />
      </CandidateAppShell>
    );
  }

  return (
    <AudienceShell audience="candidate" currentPath="/for-candidates/blog">
      <BlogPageContent posts={posts} />
    </AudienceShell>
  );
}
