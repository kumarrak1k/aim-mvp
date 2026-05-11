import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getAllPosts } from "@/app/lib/content";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";
import { BlogPageContent } from "@/app/components/pages/BlogPageContent";

export const metadata: Metadata = {
  title: "Interview Guides & Career Advice | AI Career Mentor",
};

export default async function BusinessBlogPage() {
  const { userId } = await auth();
  const posts = getAllPosts();

  if (userId) {
    return (
      <CorporateAppShell currentPath="/for-business/blog">
        <BlogPageContent posts={posts} />
      </CorporateAppShell>
    );
  }

  return (
    <AudienceShell audience="business" currentPath="/for-business/blog">
      <BlogPageContent posts={posts} />
    </AudienceShell>
  );
}
