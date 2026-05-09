import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompetitor, getAllCompetitorSlugs } from "@/app/compare/data";
import { SiteLogo } from "@/app/components/brand/SiteLogo";
import { absoluteUrl } from "@/app/config/site";

type Props = { params: Promise<{ competitor: string }> };

export async function generateStaticParams() {
  return getAllCompetitorSlugs().map((slug) => ({ competitor: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitor: slug } = await params;
  const data = getCompetitor(slug);
  if (!data) return {};
  return {
    title: `${data.tagline} | AI Career Mentor`,
    description: data.description,
    alternates: { canonical: absoluteUrl(`/compare/${slug}`) },
    openGraph: {
      title: `${data.tagline} | AI Career Mentor`,
      description: data.description,
      type: "article",
    },
  };
}

export default async function ComparisonPage({ params }: Props) {
  const { competitor: slug } = await params;
  const data = getCompetitor(slug);
  if (!data) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.tagline,
    description: data.description,
    url: absoluteUrl(`/compare/${slug}`),
  };

  return (
    <div className="relative min-h-screen bg-[#0a0614] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,60,255,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-purple-600/[0.1] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/">
            <SiteLogo href="" size="sm" showText />
          </Link>
          <Link
            href="/for-candidates"
            className="text-sm text-gray-500 transition hover:text-gray-300"
          >
            ← Back
          </Link>
        </div>

        {/* Hero */}
        <section className="mb-12 mt-8 text-center">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-purple-300/70">
            Comparison
          </p>
          <h1 className="text-[2rem] font-black leading-[1.05] tracking-[-0.05em] sm:text-[2.6rem]">
            {data.tagline}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400">
            {data.description}
          </p>
        </section>

        {/* Feature table */}
        <section className="mb-12">
          <div className="overflow-hidden rounded-[2rem] border border-white/[0.08]">
            <div className="grid grid-cols-[1fr_120px_120px] border-b border-white/[0.08] bg-white/[0.03] px-6 py-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">
                Feature
              </p>
              <p className="text-center text-xs font-black uppercase tracking-[0.12em] text-purple-300">
                AI Career Mentor
              </p>
              <p className="text-center text-xs font-black uppercase tracking-[0.12em] text-gray-500">
                {data.name.split(" ")[0]}
              </p>
            </div>
            {data.features.map((f, i) => (
              <div
                key={f.feature}
                className={`grid grid-cols-[1fr_120px_120px] items-center px-6 py-4 ${
                  i % 2 === 0 ? "" : "bg-white/[0.02]"
                }`}
              >
                <p className="text-sm text-gray-300">{f.feature}</p>
                <p className="text-center text-sm">
                  {typeof f.aim === "boolean" ? (
                    f.aim ? (
                      <span className="font-black text-emerald-400">✓</span>
                    ) : (
                      <span className="text-gray-700">—</span>
                    )
                  ) : (
                    <span className="text-xs text-gray-300">{f.aim}</span>
                  )}
                </p>
                <p className="text-center text-sm">
                  {typeof f.competitor === "boolean" ? (
                    f.competitor ? (
                      <span className="font-black text-emerald-400">✓</span>
                    ) : (
                      <span className="text-gray-700">—</span>
                    )
                  ) : (
                    <span className="text-xs text-gray-500">{f.competitor}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Strengths */}
        <section className="mb-12 grid gap-5 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-purple-300/15 bg-purple-300/[0.04] p-7">
            <p className="mb-5 text-xs font-black uppercase tracking-[0.18em] text-purple-300/70">
              Where AI Career Mentor wins
            </p>
            <ul className="space-y-3">
              {data.aimStrengths.map((s) => (
                <li key={s} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-7">
            <p className="mb-5 text-xs font-black uppercase tracking-[0.18em] text-gray-600">
              Where {data.name.split(" ")[0]} wins
            </p>
            <ul className="space-y-3">
              {data.competitorStrengths.map((s) => (
                <li key={s} className="flex items-start gap-2.5 text-sm text-gray-400">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-600" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-12 rounded-[2rem] border border-white/[0.09] bg-white/[0.04] p-8">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-gray-500">
            Bottom line
          </p>
          <p className="text-base leading-7 text-gray-300">{data.verdict}</p>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            href="/for-candidates/sign-up"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-8 py-4 text-base font-black text-white shadow-2xl shadow-purple-950/40 transition hover:scale-[1.02]"
          >
            {data.ctaLabel}
          </Link>
          <p className="mt-3 text-xs text-gray-600">
            Free to start. No credit card required.
          </p>
          <p className="mt-6 text-xs text-gray-700">
            Comparison data accurate as of{" "}
            {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}.
            We aim to be fair and factual —{" "}
            <a
              href="mailto:press@aicareermentor.co.uk"
              className="text-gray-600 hover:text-gray-400"
            >
              contact us
            </a>{" "}
            if any detail is inaccurate.
          </p>
        </section>
      </div>
    </div>
  );
}
