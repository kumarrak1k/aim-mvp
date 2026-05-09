import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPost } from "@/app/lib/content";
import { SiteLogo } from "@/app/components/brand/SiteLogo";
import { absoluteUrl } from "@/app/config/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: absoluteUrl(`/blog/${slug}`) },
    openGraph: {
      title: post.title,
      description: post.description,
      url: absoluteUrl(`/blog/${slug}`),
      type: "article",
      publishedTime: post.date,
    },
  };
}

const mdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="mb-4 mt-10 text-2xl font-black leading-tight tracking-[-0.04em] text-white first:mt-0"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="mb-3 mt-7 text-lg font-black leading-tight text-white"
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
    <strong className="font-black text-white" {...props} />
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
      className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-gray-500"
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
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    url: absoluteUrl(`/blog/${slug}`),
    publisher: {
      "@type": "Organization",
      name: "AI Career Mentor",
      url: "https://www.aicareermentor.co.uk",
    },
  };

  return (
    <div className="relative min-h-screen bg-[#0a0614] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,60,255,0.1),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-purple-600/[0.08] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/">
            <SiteLogo href="" size="sm" showText />
          </Link>
          <Link
            href="/blog"
            className="text-sm text-gray-500 transition hover:text-gray-300"
          >
            ← All guides
          </Link>
        </div>

        <header className="mb-10 mt-8 border-b border-white/[0.07] pb-8">
          {post.category && (
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-purple-300/70">
              {post.category}
            </p>
          )}
          <h1 className="text-[2rem] font-black leading-[1.06] tracking-[-0.05em] sm:text-[2.5rem]">
            {post.title}
          </h1>
          <div className="mt-4 flex items-center gap-3 text-xs text-gray-600">
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
          <p className="font-black">Ready to put this into practice?</p>
          <p className="mt-2 text-sm text-gray-400">
            AI Career Mentor generates tailored interview questions for your role
            and scores every answer with specific feedback.
          </p>
          <Link
            href="/for-candidates/sign-up"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-3.5 text-sm font-black text-white shadow-xl transition hover:scale-[1.02]"
          >
            Start practising free →
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/blog"
            className="text-sm text-gray-600 transition hover:text-gray-400"
          >
            ← Back to all guides
          </Link>
        </div>
      </div>
    </div>
  );
}
