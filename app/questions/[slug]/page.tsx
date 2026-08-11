import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getAllQuestionSets,
  getQuestionSet,
  getRelatedPosts,
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
  return getAllQuestionSets().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const set = getQuestionSet(slug);
  if (!set) return {};

  // Use a bespoke image if the MDX frontmatter defines one. Otherwise omit
  // the images fields entirely so Next's opengraph-image.tsx file convention
  // supplies a generated per-set image automatically.
  const explicitImage = set.image ? absoluteUrl(set.image) : undefined;

  return {
    title: set.title,
    description: set.description,
    keywords: set.keywords,
    alternates: buildAlternates(`/questions/${slug}`),
    openGraph: {
      title: set.title,
      description: set.description,
      url: absoluteUrl(`/questions/${slug}`),
      siteName: "AI Career Mentor",
      type: "website",
      ...(explicitImage
        ? {
            images: [
              { url: explicitImage, width: 1200, height: 1200, alt: set.title },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: set.title,
      description: set.description,
      ...(explicitImage ? { images: [explicitImage] } : {}),
    },
  };
}

/**
 * Extract up to `limit` real Q&A pairs from structured question MDX content.
 * Questions use the pattern: **Q<n>. Question text?**
 * Answers use the pattern: **Strong answer approach:** Answer text
 */
function extractFAQPairs(
  source: string,
  limit = 10
): Array<{ question: string; answer: string }> {
  const pairs: Array<{ question: string; answer: string }> = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length && pairs.length < limit; i++) {
    const qMatch = lines[i].trimEnd().match(/^\*\*Q\d+\.\s+(.+?)\*\*\s*$/);
    if (!qMatch) continue;

    const question = qMatch[1].trim();

    // Look ahead up to 7 lines for the "Strong answer approach:" line
    let answer =
      "Prepare a structured, example-led response demonstrating relevant skills and experience.";
    for (let j = i + 1; j < Math.min(i + 7, lines.length); j++) {
      const aMatch = lines[j].match(/^\*\*Strong answer approach:\*\*\s+(.+)/);
      if (aMatch) {
        answer = aMatch[1].trim().substring(0, 350);
        break;
      }
    }

    pairs.push({ question, answer });
  }

  return pairs;
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
  hr: () => <hr className="my-6 border-white/[0.07]" />,
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
};

export default async function QuestionSetPage({ params }: Props) {
  const { slug } = await params;
  const set = getQuestionSet(slug);
  if (!set) notFound();

  const faqPairs = extractFAQPairs(set.source, 10);

  // Internal-linking cards: 2 related guides by keyword overlap, plus fixed
  // cards for AI practice and the free STAR scorer.
  const relatedItems: RelatedContentItem[] = [
    ...getRelatedPosts(set, 2).map((p) => ({
      href: `/blog/${p.slug}`,
      eyebrow: "Guide",
      title: p.title,
      description: p.description,
    })),
    {
      href: "/practice",
      eyebrow: "Practice",
      title: "Practise these questions with AI",
      description:
        "Answer questions like these in a tailored mock interview and get scored feedback on every answer.",
    },
    {
      href: "/tools/star-scorer",
      eyebrow: "Free tool",
      title: "Score your own answer free",
      description:
        "Paste a STAR answer into the free scorer and get instant AI feedback. No sign-in required.",
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: set.title,
    description: set.description,
    url: absoluteUrl(`/questions/${slug}`),
    publisher: {
      "@type": "Organization",
      name: "AI Career Mentor",
      url: "https://aicareermentor.co.uk",
    },
    datePublished: set.date,
    // Use real Q&A pairs extracted from the MDX content. Fall back to a
    // synthetic summary entry only if the parser finds nothing (e.g. non-standard format).
    mainEntity:
      faqPairs.length > 0
        ? faqPairs.map(({ question, answer }) => ({
            "@type": "Question",
            name: question,
            acceptedAnswer: { "@type": "Answer", text: answer },
          }))
        : [
            {
              "@type": "Question",
              name: `What are common ${set.title} interview questions?`,
              acceptedAnswer: { "@type": "Answer", text: set.description },
            },
          ],
  };

  return (
    <AudienceShell audience="candidate" currentPath="/questions">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
        <div className="mb-6">
          <Link
            href="/questions"
            className="text-sm text-gray-400 transition hover:text-gray-300"
          >
            ← Question library
          </Link>
        </div>

        <header className="mb-10 border-b border-white/[0.07] pb-8">
          {set.category && (
            <p className="mb-3 text-[12px] font-bold tracking-wide text-purple-300/70">
              {set.category}
            </p>
          )}
          <h1 className="text-[2rem] font-bold leading-[1.06] tracking-tight sm:text-4xl">
            {set.title}
          </h1>
          <p className="mt-3 text-base leading-7 text-gray-400">
            {set.description}
          </p>
          <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
            <time dateTime={set.date}>
              Updated{" "}
              {new Date(set.date).toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
            </time>
            {set.readingTime && (
              <>
                <span>·</span>
                <span>{set.readingTime} read</span>
              </>
            )}
          </div>
        </header>

        <article>
          <MDXRemote source={set.source} components={mdxComponents} />
        </article>

        <div className="mt-14 rounded-[2rem] border border-purple-300/20 bg-purple-300/[0.06] p-8 text-center">
          <p className="font-bold">Practise these questions with AI feedback</p>
          <p className="mt-2 text-sm text-gray-400">
            AI Career Mentor generates questions tailored to your role and level,
            scores every answer, and gives you model answers for comparison.
          </p>
          <Link
            href="/for-candidates/sign-up"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl transition hover:scale-[1.02]"
          >
            Start practising free →
          </Link>
        </div>

        <RelatedContent items={relatedItems} />
      </div>
    </AudienceShell>
  );
}
