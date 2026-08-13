"use client";

import Link from "next/link";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";

const tools = [
  {
    href: "/career-docs/cv-enhancer",
    label: "CV Enhancer",
    eyebrow: "Instant analysis",
    description:
      "Paste your CV, choose your target role, and get an instant score, section-by-section feedback, rewritten bullet points, and the ATS keywords you're missing.",
    cta: "Enhance my CV →",
    gradient: "from-purple-500/20 to-fuchsia-500/20",
    border: "border-purple-400/25",
    accentText: "text-purple-300",
    accentBg: "bg-purple-400/10",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    features: ["CV score & verdict", "Section-by-section feedback", "Rewritten bullet points", "ATS keyword analysis"],
  },
  {
    href: "/career-docs/cover-letter",
    label: "Cover Letter Generator",
    eyebrow: "Tailored to the job",
    description:
      "Paste the job description and your key experience. Choose your tone (professional, enthusiastic, or concise) and get a tailored letter that mirrors the employer's language.",
    cta: "Generate cover letter →",
    gradient: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-400/25",
    accentText: "text-cyan-300",
    accentBg: "bg-cyan-400/10",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    features: ["Role-specific language", "Quantified achievements", "Three tone options", "Customisation tips"],
  },
  {
    href: "/career-docs/personal-statement",
    label: "Personal Statement",
    eyebrow: "University · Graduate · MBA",
    description:
      "From undergraduate UCAS statements to MBA essays and graduate scheme applications: tell your story compellingly, with a strong hook, coherent narrative, and the right word count.",
    cta: "Write my statement →",
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-400/25",
    accentText: "text-emerald-300",
    accentBg: "bg-emerald-400/10",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    features: ["5 statement types", "Narrative arc structure", "Hook & conclusion polish", "Word count control"],
  },
];

export default function CareerDocsPage() {
  return (
    <CandidateAppShell currentPath="/career-docs">
      <div className="mx-auto max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] px-4 py-10 sm:px-6 lg:py-16">

        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-300/10 px-4 py-2 text-xs font-bold tracking-wide text-purple-200">
            Professional · Get shortlisted
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your{" "}
            <span className="text-violet-300">
              CV &amp; Application Studio.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-gray-300 sm:text-lg">
            Stop starting from scratch. Paste your content, pick your target,
            and get a polished, tailored document in seconds: scored, improved,
            and ready to send.
          </p>
        </div>

        {/* Tool cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="group block">
              <div className={`flex h-full flex-col overflow-hidden rounded-[2rem] border ${tool.border} bg-gradient-to-br ${tool.gradient} p-7 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl`}>
                {/* Icon */}
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${tool.accentBg} ${tool.accentText}`}>
                  {tool.icon}
                </div>

                {/* Label */}
                <p className={`mb-1 text-[12px] font-bold tracking-wide ${tool.accentText}`}>
                  {tool.eyebrow}
                </p>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {tool.label}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-7 text-gray-300">
                  {tool.description}
                </p>

                {/* Feature list */}
                <ul className="mt-5 space-y-2">
                  {tool.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                      <span className={`h-1 w-1 rounded-full ${tool.accentText.replace("text-", "bg-")}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className={`mt-6 inline-flex items-center text-sm font-bold ${tool.accentText} transition group-hover:gap-2`}>
                  {tool.cta}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Advanced badge */}
        <div className="mt-10 rounded-[1.75rem] border border-white/[0.07] bg-white/[0.03] p-6 text-center">
          <p className="text-sm text-gray-400">
            Every account gets{" "}
            <span className="font-bold text-white">2 free generations</span> to
            try these out. After that they are included in the{" "}
            <span className="font-bold text-white">Professional plan.</span>{" "}
            <Link href="/pricing" className="font-bold text-purple-300 hover:text-purple-200 underline underline-offset-2">
              See plans →
            </Link>
          </p>
        </div>
      </div>
    </CandidateAppShell>
  );
}
