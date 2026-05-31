import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPANY_GUIDES, getCompanyGuide } from "../data";
import { absoluteUrl } from "@/app/config/site";
import { PublicShell } from "@/app/components/marketing/PublicShell";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return COMPANY_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getCompanyGuide(slug);
  if (!guide) return {};
  return {
    title: { absolute: `${guide.name} Interview Guide ${new Date().getFullYear()} | AI Career Mentor` },
    description: guide.metaDescription,
    alternates: { canonical: absoluteUrl(`/companies/${slug}`) },
  };
}

export default async function CompanyGuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getCompanyGuide(slug);
  if (!guide) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${guide.name} Interview Guide — How to Pass in ${new Date().getFullYear()}`,
    description: guide.metaDescription,
    url: absoluteUrl(`/companies/${slug}`),
    publisher: {
      "@type": "Organization",
      name: "AI Career Mentor",
      url: "https://aicareermentor.co.uk",
    },
    about: {
      "@type": "Organization",
      name: guide.name,
    },
  };

  return (
    <PublicShell currentPath="/companies">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
        <div className="mb-6">
          <Link href="/companies" className="text-sm text-gray-500 hover:text-gray-300">
            ← All guides
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-gray-400">
              {guide.sector}
            </span>
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
            {guide.name} Interview Guide
          </h1>
          <p className="mt-4 text-lg leading-8 text-gray-400">{guide.tagline}</p>
        </div>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">Overview</h2>
          <p className="leading-8 text-gray-300">{guide.overview}</p>
        </section>

        {/* Process */}
        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-black tracking-[-0.03em]">The interview process</h2>
          <div className="space-y-4">
            {guide.processSteps.map((step, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
              >
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-black text-purple-300">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-black text-white">{step.title}</p>
                    <p className="mt-1.5 text-sm leading-7 text-gray-400">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Competencies */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">Key competencies assessed</h2>
          <div className="flex flex-wrap gap-2">
            {guide.competencies.map((c) => (
              <span
                key={c}
                className="rounded-full border border-purple-300/20 bg-purple-500/10 px-4 py-2 text-sm font-black text-purple-200"
              >
                {c}
              </span>
            ))}
          </div>
        </section>

        {/* Sample Q&A */}
        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-black tracking-[-0.03em]">
            Common {guide.name} interview questions
          </h2>
          <div className="space-y-5">
            {guide.sampleQuestions.map((qa, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
              >
                <p className="font-black text-white">Q: &ldquo;{qa.question}&rdquo;</p>
                <div className="mt-4 border-l-2 border-purple-500/40 pl-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-purple-400">
                    How to answer
                  </p>
                  <p className="mt-2 text-sm leading-7 text-gray-400">{qa.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Insider tips */}
        <section className="mb-10">
          <h2 className="mb-6 text-2xl font-black tracking-[-0.03em]">Insider tips</h2>
          <div className="space-y-3">
            {guide.insiderTips.map((tip, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <span className="mt-0.5 text-purple-400">✦</span>
                <p className="text-sm leading-7 text-gray-300">{tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Practice CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-purple-900/60 to-[#0a0614] border border-purple-400/20 p-8 text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-400">
            AI Career Mentor
          </p>
          <h3 className="mt-3 text-2xl font-black tracking-[-0.03em]">
            Practice for your {guide.name} interview
          </h3>
          <p className="mt-3 text-sm leading-7 text-gray-400">
            Run a tailored AI mock interview for{" "}
            <strong className="text-white">{guide.practiceRole}</strong> roles. Get
            scored on content, voice delivery, and competency alignment — then refine
            before the real thing.
          </p>
          <Link
            href={`/practice?role=${encodeURIComponent(guide.practiceRole)}`}
            className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-8 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]"
          >
            Practise for {guide.name} →
          </Link>
        </div>

        {/* Back link */}
        <p className="mt-10 text-center text-sm text-gray-600">
          <Link href="/companies" className="hover:text-gray-400">
            ← View all company interview guides
          </Link>
        </p>
      </div>
    </PublicShell>
  );
}
