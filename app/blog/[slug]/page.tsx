import type { Metadata } from "next";

// Once a day, not once an hour.
//
// Hourly was inherited from the self-publishing mechanism, but that mechanism
// does not depend on it: getAllPosts() filters future-dated posts out of
// generateStaticParams, so a scheduled post has no prerendered page and is
// generated on first request once its date passes. The sitemap and the blog
// index keep their own faster cadence, which is what actually surfaces a new
// post.
//
// What hourly did buy was regenerating unchanged MDX around the clock:
// observability showed 232 ISR writes against 209 reads on one post - we were
// rewriting these pages more often than anyone read them. Daily still refreshes
// the related-posts links (the only part of an old page that changes when a new
// post lands) well within a publishing cycle, at a 24th of the writes.
export const revalidate = 86400;

import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getAllPosts,
  getPost,
  getRelatedPosts,
  getRelatedQuestionSet,
} from "@/app/lib/content";
import { absoluteUrl } from "@/app/config/site";
import { buildAlternates } from "@/app/config/seo";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import {
  RelatedContent,
  type RelatedContentItem,
} from "@/app/components/marketing/RelatedContent";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  // Use a per-post image if the MDX frontmatter defines one. Otherwise omit
  // the images fields entirely so Next's opengraph-image.tsx file convention
  // supplies a generated per-post image automatically.
  const explicitImage = post.image ? absoluteUrl(post.image) : undefined;

  return {
    // { absolute } bypasses the layout template so the suffix never doubles.
    title: { absolute: `${post.title} | AI Career Mentor` },
    description: post.description,
    keywords: post.keywords,
    alternates: buildAlternates(`/blog/${slug}`),
    openGraph: {
      title: post.title,
      description: post.description,
      url: absoluteUrl(`/blog/${slug}`),
      siteName: "AI Career Mentor",
      type: "article",
      publishedTime: post.date,
      ...(explicitImage
        ? {
            images: [
              { url: explicitImage, width: 1200, height: 1200, alt: post.title },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      ...(explicitImage ? { images: [explicitImage] } : {}),
    },
  };
}

const mdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="mb-4 mt-10 text-2xl font-bold leading-tight tracking-tight text-white first:mt-0"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="mb-3 mt-7 text-lg font-bold leading-tight text-white"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-5 leading-7 text-gray-400" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-5 space-y-2 pl-4" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-5 space-y-2 pl-5" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-sm leading-6 text-gray-400 [&::marker]:text-purple-400" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-white" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="font-semibold text-purple-300 underline-offset-2 hover:text-purple-200 hover:underline"
      {...props}
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLElement>) => (
    <blockquote
      className="my-6 border-l-2 border-purple-400/40 pl-5 italic text-gray-400"
      {...props}
    />
  ),
  hr: () => <hr className="my-8 border-white/[0.07]" />,
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 overflow-x-auto rounded-2xl border border-white/[0.08]">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="border-b border-white/[0.08] bg-white/[0.03]" {...props} />
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="px-4 py-3 text-left text-xs font-bold tracking-wide text-gray-400"
      {...props}
    />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border-t border-white/[0.05] px-4 py-3 text-gray-400" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-sm text-purple-200"
      {...props}
    />
  ),
  // Template / example blocks: wrap long lines inside the content column
  // instead of overflowing to the right of the page.
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="my-6 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 text-sm leading-6 text-gray-300 [&>code]:block [&>code]:whitespace-pre-wrap [&>code]:break-words [&>code]:bg-transparent [&>code]:p-0"
      {...props}
    />
  ),
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  // Internal-linking cards: 2 related guides, 1 matching question-bank page
  // (when a title keyword matches), and always the free STAR scorer.
  const relatedQuestionSet = getRelatedQuestionSet(post);
  const relatedItems: RelatedContentItem[] = [
    ...getRelatedPosts(post, 2).map((p) => ({
      href: `/blog/${p.slug}`,
      eyebrow: "Guide",
      title: p.title,
      description: p.description,
    })),
    ...(relatedQuestionSet
      ? [
          {
            href: `/questions/${relatedQuestionSet.slug}`,
            eyebrow: "Question bank",
            title: relatedQuestionSet.title,
            description: relatedQuestionSet.description,
          },
        ]
      : []),
    {
      href: "/tools/star-scorer",
      eyebrow: "Free tool",
      title: "Score your own answer free",
      description:
        "Paste a STAR answer into the free scorer and get instant AI feedback. No sign-in required.",
    },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    url: absoluteUrl(`/blog/${slug}`),
    image: absoluteUrl(post.image ?? "/brand/logo.jpg"),
    author: {
      "@type": "Organization",
      name: "AI Career Mentor",
      url: "https://aicareermentor.co.uk",
    },
    publisher: {
      "@type": "Organization",
      name: "AI Career Mentor",
      url: "https://aicareermentor.co.uk",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/brand/logo.jpg"),
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blog/${slug}`),
    },
  };

  return (
    <AudienceShell audience="candidate" currentPath="/blog">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
        <header className="mb-10 mt-8 border-b border-white/[0.07] pb-8">
          {post.category && (
            <p className="mb-3 text-[12px] font-bold tracking-wide text-purple-300">
              {post.category}
            </p>
          )}
          <h1 className="text-[2rem] font-bold leading-[1.06] tracking-tight sm:text-[2.5rem]">
            {post.title}
          </h1>
          <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
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
        </header>

        <article>
          <MDXRemote source={post.source} components={mdxComponents} />
        </article>

        <div className="mt-14 rounded-[2rem] border border-purple-300/20 bg-purple-300/[0.06] p-8 text-center">
          <p className="font-bold">Ready to put this into practice?</p>
          <p className="mt-2 text-sm text-gray-400">
            AI Career Mentor generates tailored interview questions for your role
            and scores every answer with specific feedback.
          </p>
          <Link
            href="/for-candidates/sign-up"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-7 py-3.5 text-sm font-bold text-on-accent shadow-xl transition hover:scale-[1.02]"
          >
            Start practising free →
          </Link>
        </div>

        <RelatedContent items={relatedItems} />

        <div className="mt-8 text-center">
          <Link
            href="/blog"
            className="text-sm text-gray-400 transition hover:text-gray-400"
          >
            ← Back to all guides
          </Link>
        </div>
      </div>
    </AudienceShell>
  );
}
