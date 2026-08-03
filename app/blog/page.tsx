import type { Metadata } from "next";

// This page is rendered per-request (it reads auth via CandidateShell to
// show the right header), so scheduled/future-dated posts publish
// themselves as soon as their date passes — no ISR revalidate needed.
import { getAllPosts } from "@/app/lib/content";
import { absoluteUrl } from "@/app/config/site";
import { buildAlternates } from "@/app/config/seo";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";
import { BlogPageContent } from "@/app/components/pages/BlogPageContent";

const _ogImage = absoluteUrl("/brand/logo.jpg");

export const metadata: Metadata = {
  title: { absolute: "Interview Guides & Career Advice | AI Career Mentor" },
  description:
    "In-depth guides on interview technique, competency frameworks, assessment centres, and career preparation, written by the AI Career Mentor team.",
  alternates: buildAlternates("/blog"),
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
    <CandidateShell currentPath="/blog">
      <BlogPageContent posts={posts} />
    </CandidateShell>
  );
}
