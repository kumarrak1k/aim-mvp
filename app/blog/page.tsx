import type { Metadata } from "next";

// Revalidate hourly so scheduled (future-dated) posts publish themselves.
export const revalidate = 3600;

import { getAllPosts } from "@/app/lib/content";
import { absoluteUrl } from "@/app/config/site";
import { PublicShell } from "@/app/components/marketing/PublicShell";
import { BlogPageContent } from "@/app/components/pages/BlogPageContent";

const _ogImage = absoluteUrl("/brand/logo.jpg");

export const metadata: Metadata = {
  title: { absolute: "Interview Guides & Career Advice | AI Career Mentor" },
  description:
    "In-depth guides on interview technique, competency frameworks, assessment centres, and career preparation, written by the AI Career Mentor team.",
  alternates: { canonical: absoluteUrl("/blog") },
  openGraph: {
    title: "Interview Guides & Career Advice | AI Career Mentor",
    description:
      "In-depth guides on interview technique, competency frameworks, assessment centres, and career preparation, written by the AI Career Mentor team.",
    url: absoluteUrl("/blog"),
    siteName: "AI Career Mentor",
    type: "website",
    images: [{ url: _ogImage, width: 1200, height: 1200, alt: "AI Career Mentor Interview Guides" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interview Guides & Career Advice | AI Career Mentor",
    description:
      "In-depth guides on interview technique, competency frameworks, assessment centres, and career preparation, written by the AI Career Mentor team.",
    images: [_ogImage],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <PublicShell currentPath="/blog">
      <BlogPageContent posts={posts} />
    </PublicShell>
  );
}
