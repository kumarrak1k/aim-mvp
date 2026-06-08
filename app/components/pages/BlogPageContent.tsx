import Link from "next/link";
import type { getAllPosts } from "@/app/lib/content";
import { BlogClient } from "@/app/blog/components/BlogClient";

const faqs = [
  {
    q: "What topics does the blog cover?",
    a: "Interview technique, STAR method, competency frameworks, assessment centre preparation, career strategy, salary negotiation, and preparation guides for specific roles and employers including Big 4 consulting, investment banking, and the Civil Service Fast Stream.",
  },
  {
    q: "Are the guides free to read?",
    a: "All blog content is free and publicly accessible without an account.",
  },
  {
    q: "Who writes the AI Career Mentor guides?",
    a: "Guides are written by the AI Career Mentor team, drawing on real interview question data, assessment centre research, and candidate coaching experience.",
  },
  {
    q: "How often is new content published?",
    a: "New guides are published regularly, covering the latest interview formats, assessment centre preparation, and career strategy. Subscribe to be notified of new articles.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export function BlogPageContent({
  posts,
}: {
  posts: ReturnType<typeof getAllPosts>;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
        <header className="mb-14 border-b border-white/[0.08] pb-10 text-center">
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
            Interview guides
          </p>
          <h1 className="text-[2.2rem] font-black leading-[1.05] tracking-[-0.05em] sm:text-4xl">
            Prepare smarter. Get hired.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400">
            In-depth guides on interview technique, competency frameworks,
            assessment centres, and career strategy.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-gray-500">Articles coming soon.</p>
        ) : (
          <BlogClient posts={posts} />
        )}

        <div className="mt-14 border-t border-white/[0.07] pt-10">
          <h2 className="mb-8 text-2xl font-black tracking-[-0.04em]">
            Frequently asked questions
          </h2>
          <div className="mb-12 divide-y divide-white/[0.07]">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-black text-white">
                  {faq.q}
                  <span className="mt-0.5 shrink-0 text-gray-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-gray-400">{faq.a}</p>
              </details>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Want tailored interview practice?{" "}
            <Link
              href="/for-candidates/sign-up"
              className="font-black text-purple-300 hover:text-purple-200"
            >
              Start free →
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
