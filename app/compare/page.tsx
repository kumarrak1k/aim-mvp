import type { Metadata } from "next";
import Link from "next/link";
import { competitors } from "@/app/compare/data";
import { createPageMetadata } from "@/app/config/seo";
import { absoluteUrl } from "@/app/config/site";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";

export const metadata: Metadata = createPageMetadata({
  path: "/compare",
  title: "The Best AI Interview Practice Tools in 2026",
  description:
    "An honest comparison of the best AI interview practice tools in 2026: AI Career Mentor, Yoodli, Big Interview, Google Interview Warmup, LinkedIn Interview Prep, and ChatGPT, compared on feedback depth, voice and camera analysis, assessment centres, and price.",
  keywords: [
    "best AI interview practice tools",
    "AI interview tools 2026",
    "AI mock interview comparison",
    "Yoodli alternative",
    "Big Interview alternative",
    "Interview Warmup alternative",
  ],
});

/** Pull the competitor's pricing string from the shared comparison data. */
function competitorPrice(slug: string): string {
  const row = competitors[slug]?.features.find((f) => f.feature === "Pricing");
  return typeof row?.competitor === "string" ? row.competitor : "See website";
}

type RoundupTool = {
  key: string;
  name: string;
  capabilities: string;
  price: string;
  bestFor: string;
  editorial: string;
  href: string;
  linkLabel: string;
};

const tools: RoundupTool[] = [
  {
    key: "ai-career-mentor",
    name: "AI Career Mentor",
    capabilities:
      "Answer, voice and camera scoring, STAR analysis, model answers, mock assessment centres",
    price: "Free + from £19/month",
    bestFor: "UK candidates preparing seriously for a specific role",
    editorial:
      "AI Career Mentor scores what you say and how you say it: every answer gets structured feedback across content, STAR structure, voice delivery and camera presence, with a model answer to benchmark against. It also includes a mock assessment centre with case study, competency interview and presentation exercises, which none of the other tools here offer. It is built and hosted in the UK with GDPR-first data handling, and questions are generated for your exact role, level and interview format rather than pulled from a generic bank.",
    href: "/for-candidates",
    linkLabel: "See how it works",
  },
  {
    key: "yoodli",
    name: "Yoodli",
    capabilities:
      "Deep speech analytics: filler words, pacing, eye contact, delivery metrics",
    price: competitorPrice("yoodli"),
    bestFor: "Delivery coaching for presentations and general communication",
    editorial:
      "Yoodli has the deepest speech analytics of any tool in this list, with granular metrics on filler words, pacing and eye contact, and it works well beyond interviews for presentations, meetings and sales calls. It does not score the substance or structure of your answers, so it is best paired with content-focused preparation.",
    href: "/compare/yoodli",
    linkLabel: "Read the full comparison",
  },
  {
    key: "big-interview",
    name: "Big Interview",
    capabilities:
      "Video practice, human-led coaching curriculum, large question library, CV tools",
    price: competitorPrice("big-interview"),
    bestFor: "Learning interview theory from scratch with structured lessons",
    editorial:
      "Big Interview is the most established platform here, with an extensive video coaching curriculum, a large question library, and bundled CV and job search tools. It is a strong choice if you want to learn interview technique from first principles with human guidance, though its AI feedback is less granular and there is no camera presence scoring.",
    href: "/compare/big-interview",
    linkLabel: "Read the full comparison",
  },
  {
    key: "interview-warmup",
    name: "Interview Warmup (Google)",
    capabilities: "Basic question practice with transcripts and talking-point insights",
    price: competitorPrice("interview-warmup"),
    bestFor: "First-time practice with zero commitment",
    editorial:
      "Google's Interview Warmup is completely free with no sign-up required, which makes it the easiest possible entry point. You answer questions aloud and get transcripts plus insights on your talking points. There is no scoring, no tailored questions and no progress tracking, so most candidates outgrow it quickly.",
    href: "/compare/interview-warmup",
    linkLabel: "Read the full comparison",
  },
  {
    key: "linkedin-interview-prep",
    name: "LinkedIn Interview Prep",
    capabilities:
      "Category-based questions, basic AI video feedback, recruiter-sourced question bank",
    price: competitorPrice("linkedin-interview-prep"),
    bestFor: "Quick warm-ups inside an account you already have",
    editorial:
      "LinkedIn Interview Prep is convenient because it lives inside an account most candidates already have, and its question bank draws on real recruiter data. Feedback on recorded answers stops at general tips, though: there is no structured scoring, no model answers and no improvement plan.",
    href: "/compare/linkedin-interview-prep",
    linkLabel: "Read the full comparison",
  },
  {
    key: "chatgpt",
    name: "ChatGPT",
    capabilities: "Answer brainstorming and informal feedback on any topic",
    price: competitorPrice("chatgpt"),
    bestFor: "Drafting and refining example answers",
    editorial:
      "ChatGPT is the most flexible option: you can brainstorm example answers, ask for informal feedback and explore any industry or role. It is not an interview coach, though: there is no consistent scoring rubric, no voice or camera analysis and no session history, so your practice never compounds.",
    href: "/compare/chatgpt",
    linkLabel: "Read the full comparison",
  },
];

const faqs = [
  {
    q: "Are AI interview tools worth it?",
    a: "Yes, for most candidates. Structured, repeatable practice with instant feedback is the fastest way to improve interview performance, and AI tools deliver it at a fraction of the cost of a human coach. The key is choosing a tool that scores the substance of your answers as well as your delivery, and most tools in this list have a free tier so you can test them before paying.",
  },
  {
    q: "What is the best free AI interview practice tool?",
    a: "Google's Interview Warmup is completely free with no sign-up, which makes it the best zero-commitment starting point. For free feedback with actual scoring, AI Career Mentor's free STAR answer scorer grades a written answer instantly without an account, and its free tier includes tailored practice questions.",
  },
  {
    q: "Can AI replace a human interview coach?",
    a: "Not entirely: a good human coach brings judgement, industry contacts and accountability. But AI tools let you practise far more often, give consistent scoring you can track over time, and remove the scheduling and cost barriers. Many candidates combine daily AI practice with an occasional human session.",
  },
];

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "The best AI interview practice tools in 2026",
  description:
    "Editorial comparison of AI interview practice tools ranked on feedback depth, voice and camera analysis, assessment centres, and price.",
  itemListOrder: "https://schema.org/ItemListOrderAscending",
  numberOfItems: tools.length,
  itemListElement: tools.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.name,
    url: absoluteUrl(tool.href),
  })),
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default function CompareIndexPage() {
  return (
    <CandidateShell currentPath="/compare">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6">
        {/* Hero */}
        <section className="mb-12 mt-8 text-center">
          <p className="mb-4 text-[12px] font-bold tracking-wide text-purple-300/70">
            Editorial comparison
          </p>
          <h1 className="text-[2rem] font-bold leading-[1.05] tracking-tight sm:text-4xl">
            The best AI interview practice tools in 2026
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-400">
            AI interview tools let you rehearse real questions aloud and get
            instant feedback, without booking a coach or roping in a friend. We
            compared the leading options on four things that actually matter:
            feedback depth, voice and camera analysis, assessment centre
            coverage, and price. Here is how they stack up, honestly.
          </p>
        </section>

        {/* Comparison table */}
        <section className="mb-14">
          <div className="overflow-x-auto rounded-[2rem] border border-white/[0.08]">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[1.3fr_2fr_1.1fr_1.5fr] border-b border-white/[0.08] bg-white/[0.03] px-6 py-4">
                <p className="text-xs font-bold tracking-wide text-gray-400">
                  Tool
                </p>
                <p className="text-xs font-bold tracking-wide text-gray-400">
                  Key capabilities
                </p>
                <p className="text-xs font-bold tracking-wide text-gray-400">
                  Price
                </p>
                <p className="text-xs font-bold tracking-wide text-gray-400">
                  Best for
                </p>
              </div>
              {tools.map((tool, i) => (
                <div
                  key={tool.key}
                  className={`grid grid-cols-[1.3fr_2fr_1.1fr_1.5fr] items-center gap-x-4 px-6 py-4 ${
                    i % 2 === 0 ? "" : "bg-white/[0.02]"
                  }`}
                >
                  <p
                    className={`text-sm font-bold ${
                      tool.key === "ai-career-mentor"
                        ? "text-purple-300"
                        : "text-gray-300"
                    }`}
                  >
                    {tool.name}
                  </p>
                  <p className="text-xs leading-5 text-gray-400">
                    {tool.capabilities}
                  </p>
                  <p className="text-xs leading-5 text-gray-400">{tool.price}</p>
                  <p className="text-xs leading-5 text-gray-400">{tool.bestFor}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-700">
            Pricing and features accurate as of{" "}
            {new Date().toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
            . We aim to be fair and factual, so{" "}
            <a
              href="mailto:press@aicareermentor.co.uk"
              className="text-gray-400 hover:text-gray-400"
            >
              contact us
            </a>{" "}
            if any detail is inaccurate.
          </p>
        </section>

        {/* Per-tool editorial sections */}
        <section className="mb-14">
          <h2 className="mb-8 text-2xl font-bold tracking-tight">
            Each tool, honestly
          </h2>
          <div className="space-y-5">
            {tools.map((tool, index) => (
              <div
                key={tool.key}
                className={`rounded-[2rem] border p-7 ${
                  tool.key === "ai-career-mentor"
                    ? "border-purple-300/20 bg-purple-300/[0.05]"
                    : "border-white/[0.08] bg-white/[0.03]"
                }`}
              >
                <div className="mb-3 flex items-baseline gap-3">
                  <span className="text-xs font-bold text-gray-400">
                    {index + 1}.
                  </span>
                  <h3 className="text-lg font-bold leading-tight text-white">
                    {tool.name}
                  </h3>
                </div>
                <p className="text-sm leading-7 text-gray-400">
                  {tool.editorial}
                </p>
                <Link
                  href={tool.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-purple-300 transition hover:text-purple-200"
                >
                  {tool.linkLabel} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-14 border-t border-white/[0.07] pt-10">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <div className="divide-y divide-white/[0.07]">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-5">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-white">
                  {faq.q}
                  <span className="mt-0.5 shrink-0 text-gray-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-gray-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-[2rem] border border-purple-300/20 bg-purple-300/[0.06] p-8 text-center">
          <p className="font-bold">Try before you commit</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-400">
            Score one of your own answers with the free STAR scorer (no account
            needed), then start a 3-day free trial to practise with voice and
            camera feedback.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/for-candidates/sign-up"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl transition hover:scale-[1.02]"
            >
              Start your free trial →
            </Link>
            <Link
              href="/tools/star-scorer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/[0.08]"
            >
              Score an answer free
            </Link>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Free to start. No credit card required.
          </p>
        </section>
      </div>
    </CandidateShell>
  );
}
