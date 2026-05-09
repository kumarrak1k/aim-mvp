import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/app/lib/content";
import { SiteLogo } from "@/app/components/brand/SiteLogo";
import { absoluteUrl } from "@/app/config/site";

export const metadata: Metadata = {
  title: "Interview Guides & Career Advice | AI Career Mentor",
  description:
    "In-depth guides on interview technique, competency frameworks, assessment centres, and career preparation — written by the AI Career Mentor team.",
  alternates: { canonical: absoluteUrl("/blog") },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="relative min-h-screen bg-[#0a0614] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,60,255,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-purple-600/[0.1] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
        <Link href="/" className="mb-8 inline-block">
          <SiteLogo href="" size="md" showText />
        </Link>

        <header className="mb-14 mt-10 border-b border-white/[0.08] pb-10">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-purple-300/80">
            Interview guides
          </p>
          <h1 className="text-[2.2rem] font-black leading-[1.05] tracking-[-0.05em] sm:text-4xl">
            Prepare smarter. Get hired.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-gray-400">
            In-depth guides on interview technique, competency frameworks,
            assessment centres, and career strategy.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-gray-500">Articles coming soon.</p>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {posts.map((post) => (
              <article key={post.slug} className="group py-8 first:pt-0">
                <Link href={`/blog/${post.slug}`}>
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      {post.category && (
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-300/70">
                          {post.category}
                        </p>
                      )}
                      <h2 className="text-xl font-black leading-tight tracking-[-0.03em] transition group-hover:text-purple-200">
                        {post.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-gray-400">
                        {post.description}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
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
                    </div>
                    <span className="mt-1 shrink-0 text-gray-600 transition group-hover:text-purple-300">
                      →
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}

        <div className="mt-14 border-t border-white/[0.07] pt-10">
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
    </div>
  );
}
