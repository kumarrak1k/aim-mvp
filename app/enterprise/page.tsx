import type { Metadata } from "next";
import Link from "next/link";
import { createPageMetadata } from "@/app/config/seo";
import {
  BulletList,
  GlassCard,
  MarketingShell,
  SectionHeading,
} from "../components/marketing/MarketingShell";

export const metadata: Metadata = createPageMetadata({
  path: "/enterprise",
  title: "Enterprise AI Assessment Platform",
  description:
    "AI Career Mentor for talent teams, assessment centres, and HR departments. Custom templates, candidate management, competency frameworks, and DPA-ready data handling.",
  keywords: [
    "enterprise AI interview assessment",
    "candidate assessment platform",
    "AI talent evaluation",
    "assessment centre software",
    "recruiter AI tool",
    "bulk candidate assessment",
  ],
});

const features = [
  {
    icon: "📋",
    title: "Custom assessment templates",
    description:
      "Build reusable interview configurations per role, level, and function. Include your competency framework and scoring criteria.",
  },
  {
    icon: "👥",
    title: "Team access & roles",
    description:
      "Invite recruiters, hiring managers, and viewers. Granular role-based permissions keep your team aligned.",
  },
  {
    icon: "🔗",
    title: "Candidate invite management",
    description:
      "Generate unique, time-limited assessment links per candidate. Track status — pending, started, completed — in real time.",
  },
  {
    icon: "📊",
    title: "Results dashboard",
    description:
      "All candidate results in one place. Review AI-generated scores, hire signals, and structured feedback per question.",
  },
  {
    icon: "🎨",
    title: "White-label branding",
    description:
      "Your logo, brand colour, and company name on every candidate-facing page. Candidates see your brand, not ours.",
  },
  {
    icon: "🔒",
    title: "UK GDPR & DPA ready",
    description:
      "We act as your data processor. Data Processing Agreement available. Candidates are informed transparently of what is processed and why.",
  },
];

const trustItems = [
  "Data residency: EU-based Neon PostgreSQL",
  "Authentication: Clerk — SOC 2 Type II certified",
  "AI inference: OpenAI with no training on your data",
  "Hosting: Vercel edge network with DDoS protection",
  "No third-party advertising trackers",
  "Candidate data deleted on request within 30 days",
];

const useCases = [
  {
    title: "Graduate recruitment",
    description:
      "Screen hundreds of applicants consistently before first-round interviews. Use competency frameworks to align assessments with your graduate scheme criteria.",
  },
  {
    title: "Assessment centres",
    description:
      "Replace or augment group exercises with individual AI-driven assessments. Reduce assessor time while increasing consistency.",
  },
  {
    title: "Volume hiring",
    description:
      "Send assessment links in bulk for contact centre, retail, or ops roles. Candidates complete at their own pace, results come back structured.",
  },
  {
    title: "Executive selection",
    description:
      "Configure executive-level difficulty and stakeholder management focus. Generate structured evidence for senior-level decisions.",
  },
];

export default function EnterprisePage() {
  return (
    <MarketingShell currentPath="/enterprise">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.24em] text-fuchsia-300">Enterprise</p>
          <h1 className="text-5xl font-black tracking-[-0.05em] sm:text-6xl lg:text-7xl">
            AI-powered assessments for talent teams.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
            Send structured interview assessments to any number of candidates. Custom templates, competency frameworks, recruiter dashboards, and DPA-ready data handling.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="mailto:enterprise@aicareermentor.co.uk">
              <button className="rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 px-8 py-4 text-base font-black text-white shadow-xl shadow-purple-950/35 transition hover:scale-[1.02]">
                Talk to sales →
              </button>
            </Link>
            <Link href="/company/setup">
              <button className="rounded-full border border-white/15 bg-white/[0.05] px-8 py-4 text-base font-black text-white transition hover:bg-white/[0.09]">
                Start free trial
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <SectionHeading
          eyebrow="Platform features"
          title="Everything your talent team needs."
          description="Purpose-built for structured candidate evaluation at any scale."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon, title, description }) => (
            <GlassCard key={title}>
              <div className="mb-4 text-3xl">{icon}</div>
              <h3 className="mb-2 text-lg font-black">{title}</h3>
              <p className="text-sm leading-7 text-gray-300">{description}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <SectionHeading
          eyebrow="Use cases"
          title="Built for how you actually hire."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {useCases.map(({ title, description }) => (
            <div key={title} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
              <h3 className="mb-3 text-xl font-black">{title}</h3>
              <p className="text-sm leading-7 text-gray-300">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & compliance */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <GlassCard>
            <SectionHeading
              eyebrow="Trust & compliance"
              title="Built for regulated environments."
            />
            <div className="mt-7">
              <BulletList items={trustItems} />
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/privacy">
                <button className="rounded-full border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.09]">
                  Privacy policy
                </button>
              </Link>
              <Link href="mailto:privacy@aicareermentor.co.uk">
                <button className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-2.5 text-sm font-black text-cyan-200 transition hover:bg-cyan-400/15">
                  Request DPA
                </button>
              </Link>
            </div>
          </GlassCard>

          <GlassCard>
            <SectionHeading
              eyebrow="Pricing"
              title="Custom plans for your team size."
            />
            <p className="mt-4 leading-7 text-gray-300">
              Enterprise pricing is based on team size and usage volume. We offer annual contracts with dedicated onboarding, priority support, and SLA commitments for larger deployments.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-300">
              {[
                "Unlimited candidate assessments",
                "Custom template builds included",
                "Named account manager",
                "Priority email & video support",
                "Invoiced billing (no credit card required)",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-fuchsia-400" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="mailto:enterprise@aicareermentor.co.uk">
                <button className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 py-3.5 text-sm font-black text-white shadow-xl shadow-purple-950/25 transition hover:scale-[1.02]">
                  Get a quote →
                </button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="rounded-[2rem] border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/10 via-purple-500/10 to-blue-500/5 p-10 text-center shadow-2xl shadow-black/10">
          <h2 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Ready to transform your hiring process?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-300">
            Set up your company workspace for free. No credit card required. Upgrade to Enterprise when you need scale.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/company/setup">
              <button className="rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 px-8 py-4 text-base font-black text-white shadow-xl shadow-purple-950/35 transition hover:scale-[1.02]">
                Create workspace free →
              </button>
            </Link>
            <Link href="mailto:enterprise@aicareermentor.co.uk">
              <button className="rounded-full border border-white/15 bg-white/[0.05] px-8 py-4 text-base font-black text-white transition hover:bg-white/[0.09]">
                Contact enterprise sales
              </button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
