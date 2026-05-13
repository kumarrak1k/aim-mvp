import Link from "next/link";
import type { Metadata } from "next";
import { NeutralShell } from "@/app/components/marketing/NeutralShell";
import { GlassCard, SectionHeading } from "@/app/components/marketing/primitives";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AI Career Mentor handles your interview data, CV context, voice recordings, camera permissions and your rights under GDPR.",
};

const dataWeCollect = [
  {
    title: "Profile context",
    text: "CV text, target role details and interview goals you choose to save. Stored securely in your account via Clerk authentication.",
  },
  {
    title: "Practice session data",
    text: "Your answers, AI feedback, scores, voice delivery metrics and camera presence metrics from completed sessions you choose to save.",
  },
  {
    title: "Microphone input",
    text: "When you use voice mode, your speech is transcribed by your browser's built-in speech recognition. In Chrome this is processed by Google; in Safari by Apple. AI Career Mentor receives only the resulting text transcript — not the audio. Only that transcript is used for feedback.",
  },
  {
    title: "Camera input",
    text: "Camera video processed locally in your browser for presence signals. Raw video frames are never sent to our servers or stored.",
  },
];

const dataProcessors = [
  {
    name: "OpenAI",
    purpose: "Generates interview questions, cleans transcripts, produces feedback and model answers. CV text, role details and practice answers are sent to OpenAI's API to deliver these features. We have disabled all data-sharing and model-training settings in our OpenAI account. OpenAI processes data under their API usage policy and does not use API inputs to train models. A formal Data Processing Agreement will be put in place upon our incorporation.",
    link: "https://openai.com/policies/privacy-policy",
  },
  {
    name: "Clerk",
    purpose: "Handles authentication, account management and stores your candidate profile metadata securely.",
    link: "https://clerk.com/legal/privacy",
  },
  {
    name: "Neon / PostgreSQL",
    purpose: "Stores your saved practice session records in a managed PostgreSQL database.",
    link: "https://neon.tech/privacy-policy",
  },
  {
    name: "Stripe",
    purpose: "Handles payment processing for subscriptions. Receives your email address and billing details. No interview content is shared with Stripe.",
    link: "https://stripe.com/gb/privacy",
  },
  {
    name: "Resend",
    purpose: "Sends transactional emails (invite links, account emails). Receives your email address only. No CV or interview data is included in emails.",
    link: "https://resend.com/legal/privacy-policy",
  },
  {
    name: "Vercel",
    purpose: "Hosts the AI Career Mentor platform and serves all pages and API routes. Collects anonymous page-view analytics and Core Web Vitals — no personal identity data.",
    link: "https://vercel.com/legal/privacy-policy",
  },
];

const yourRights = [
  {
    title: "Access your data",
    text: "You can export your profile and saved sessions at any time from your profile page.",
  },
  {
    title: "Delete your data",
    text: "You can delete all saved sessions and your full candidate profile from the Privacy & data controls section on your profile page.",
  },
  {
    title: "Correct your data",
    text: "You can update your CV context, role details and interview goals at any time from your profile.",
  },
  {
    title: "Withdraw consent",
    text: "You can stop using the platform at any time. Deleting your account removes access to your data.",
  },
];

const commitments = [
  "We do not sell your personal information.",
  "We do not use your interview answers or CV to make hiring decisions.",
  "We do not share your data with employers.",
  "Raw uploaded files are not stored — only extracted text you choose to save.",
  "Voice recordings and camera video stay in your browser and are not stored.",
  "You control deletion of all your practice data from your profile.",
];

export default function PrivacyPage() {
  return (
    <NeutralShell>
      <section className="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 sm:pb-10 sm:pt-12">
        <div className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.065] p-6 shadow-2xl shadow-purple-950/20 backdrop-blur-2xl sm:p-8 md:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Privacy policy
            </p>
            <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.055em] md:text-5xl">
              Your interview data belongs to you.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-gray-300 md:text-lg">
              AI Career Mentor is built to keep your CV, answers and delivery
              data under your control. This page explains exactly what we
              collect, how we use it, who we share it with, and how to delete
              it.
            </p>

            <p className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
              Last updated: May 2026. This page reflects our current product
              behaviour. We recommend reviewing it periodically. For questions,
              contact us at{" "}
              <span className="font-bold text-amber-50">
                privacy@aicareermentor.co.uk
              </span>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-12">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">

            <GlassCard>
              <SectionHeading
                eyebrow="What we collect"
                title="Data we hold about you."
                description="We collect only what is necessary to deliver personalised interview coaching."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {dataWeCollect.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"
                  >
                    <h3 className="mb-2 font-black text-white">{item.title}</h3>
                    <p className="text-sm leading-7 text-gray-400">{item.text}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <SectionHeading
                eyebrow="How we use your data"
                title="What your data is used for."
              />
              <div className="mt-6 space-y-4 text-sm leading-7 text-gray-300">
                <p>
                  Your profile context (CV text, role details, goals) and
                  practice answers are sent to OpenAI to generate personalised
                  interview questions, feedback, scores and session summaries.
                  This is necessary to deliver the core coaching features.
                </p>
                <p>
                  We have disabled all data-sharing and training settings in our
                  OpenAI account. OpenAI&apos;s API terms prohibit using API
                  inputs to train models. We are working to put a formal Data
                  Processing Agreement in place and will update this page when
                  that is complete.
                </p>
                <p>
                  If you choose to save a session, your feedback and scores are
                  stored in your account. Unsaved sessions are discarded at the
                  end of the session.
                </p>
                <p>
                  Voice delivery metrics (pace, fillers, energy) are calculated
                  locally in your browser from your answer text. They are not
                  derived from audio files sent to a server.
                </p>
                <p>
                  Camera presence signals are generated locally using browser
                  APIs. No video frames are transmitted to our servers.
                </p>
                <p className="font-semibold text-white">
                  Your data is never used to train AI models, never sold to
                  third parties, and never shared with employers.
                </p>
              </div>
            </GlassCard>

            <GlassCard>
              <SectionHeading
                eyebrow="Data processors"
                title="Who we share your data with."
                description="We use the following trusted sub-processors to deliver the platform."
              />
              <div className="mt-6 space-y-4">
                {dataProcessors.map((processor) => (
                  <div
                    key={processor.name}
                    className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-black/25 p-5 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-black text-white">{processor.name}</p>
                      <p className="mt-1 text-sm leading-7 text-gray-400">
                        {processor.purpose}
                      </p>
                    </div>
                    <a
                      href={processor.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs font-black text-cyan-300 hover:text-cyan-100"
                    >
                      Privacy policy →
                    </a>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <SectionHeading
                eyebrow="Data retention"
                title="How long we keep your data."
              />
              <div className="mt-6 space-y-4 text-sm leading-7 text-gray-300">
                <p>
                  <span className="font-black text-white">Profile context</span>{" "}
                  — Stored until you delete it from your profile or delete your
                  account. You can clear CV text, role context or goals
                  individually.
                </p>
                <p>
                  <span className="font-black text-white">
                    Saved practice sessions
                  </span>{" "}
                  — Stored until you delete them individually or bulk-delete all
                  sessions from your profile page.
                </p>
                <p>
                  <span className="font-black text-white">
                    Voice and camera data
                  </span>{" "}
                  — Processed in your browser only. Never stored on our servers.
                </p>
                <p>
                  <span className="font-black text-white">Account data</span> —
                  Managed by Clerk. Deleting your Clerk account removes
                  authentication access. Contact us to request full data
                  deletion.
                </p>
              </div>
            </GlassCard>

            <GlassCard>
              <SectionHeading
                eyebrow="Your rights"
                title="Control your data."
                description="Under UK GDPR and applicable data protection law, you have the following rights."
              />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {yourRights.map((right) => (
                  <div
                    key={right.title}
                    className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"
                  >
                    <p className="font-black text-white">{right.title}</p>
                    <p className="mt-2 text-sm leading-7 text-gray-400">
                      {right.text}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-gray-400">
                To exercise any of these rights, use the data controls on your
                profile page or contact{" "}
                <span className="font-bold text-gray-200">
                  privacy@aicareermentor.co.uk
                </span>
                . We will respond within 30 days.
              </p>
            </GlassCard>

            <GlassCard>
              <SectionHeading
                eyebrow="Cookies and tracking"
                title="Cookies and analytics."
              />
              <div className="mt-6 space-y-4 text-sm leading-7 text-gray-300">
                <p>
                  AI Career Mentor uses essential cookies for authentication
                  (set by Clerk). We do not currently use advertising cookies or
                  third-party tracking.
                </p>
                <p>
                  If we introduce analytics in the future, this page will be
                  updated and you will be informed.
                </p>
              </div>
            </GlassCard>

          </div>

          <aside className="space-y-6">
            <GlassCard>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
                Our commitments
              </p>
              <div className="space-y-3 text-sm leading-6 text-gray-400">
                {commitments.map((item) => (
                  <p key={item} className="flex gap-2">
                    <span className="mt-0.5 text-emerald-400">✓</span>
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                Your data controls
              </p>
              <div className="space-y-3">
                <Link href="/profile">
                  <button className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]">
                    Manage profile &amp; delete data
                  </button>
                </Link>
                <Link href="/practice">
                  <button className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.09]">
                    Start practice
                  </button>
                </Link>
                <Link href="/terms">
                  <button className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-gray-300 transition hover:bg-white/[0.07]">
                    Terms of use
                  </button>
                </Link>
              </div>
            </GlassCard>

            <GlassCard>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-purple-300">
                Contact
              </p>
              <div className="space-y-3 text-sm leading-6 text-gray-400">
                <p>
                  For privacy queries, data requests or complaints, contact us
                  at:
                </p>
                <p className="font-bold text-gray-200">
                  privacy@aicareermentor.co.uk
                </p>
                <p>
                  We take privacy concerns seriously and aim to respond within
                  30 days.
                </p>
              </div>
            </GlassCard>

            <GlassCard>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-amber-300">
                Browser permissions
              </p>
              <div className="space-y-3 text-sm leading-6 text-gray-400">
                <p>
                  Microphone and camera access are requested in your browser
                  only when you start a voice or camera practice session. You
                  can deny or revoke these permissions at any time in your
                  browser settings.
                </p>
                <p>
                  You can practise without a microphone or camera — typed
                  answers receive the same written feedback.
                </p>
              </div>
            </GlassCard>
          </aside>
        </div>
      </section>
    </NeutralShell>
  );
}
