import Link from "next/link";
import type { Metadata } from "next";
import { PublicShell } from "@/app/components/marketing/PublicShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AI Career Mentor handles your interview data, CV context, voice recordings, camera permissions and your rights under GDPR.",
};

const dataWeCollect = [
  {
    title: "Profile context",
    text: "CV text, target role details and interview goals you choose to save. Stored securely in your account.",
  },
  {
    title: "Practice session data",
    text: "Your answers, AI feedback, scores, voice delivery metrics and camera presence metrics from completed sessions you choose to save.",
  },
  {
    title: "Microphone input",
    text: "When you use voice mode, your speech is transcribed by your browser's built-in speech recognition — AI Career Mentor receives only the resulting text transcript, not the audio. The browser vendor that processes your speech depends on which browser you use: Chrome and other Chromium-based browsers (Brave, Opera) use Google; Edge uses Microsoft; Safari uses Apple. Firefox does not support voice mode. Voice mode is entirely optional — typed answers receive the same feedback.",
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
    <PublicShell currentPath="/privacy">
      <div>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 pb-12 pt-6 text-center sm:px-6 sm:pt-10">
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
            Privacy policy
          </p>
          <h1 className="mx-auto max-w-3xl text-[2.2rem] font-black leading-[1.06] tracking-[-0.05em] sm:text-5xl">
            Your interview data{" "}
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              belongs to you.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-gray-400">
            We collect only what is necessary to deliver personalised interview
            coaching. This page explains exactly what we collect, how we use it,
            who we share it with, and how to delete it.
          </p>
          <p className="mx-auto mt-5 max-w-xl rounded-2xl border border-amber-300/15 bg-amber-300/[0.08] px-5 py-3 text-sm leading-6 text-amber-100">
            Last updated: May 2026. For questions contact{" "}
            <span className="font-bold text-amber-50">
              privacy@aicareermentor.co.uk
            </span>
            .
          </p>
        </section>

        {/* Body */}
        <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_300px]">

            {/* Main column */}
            <div className="space-y-10">

              {/* What we collect */}
              <div>
                <h2 className="mb-6 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                  Data we hold about you.
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  {dataWeCollect.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6"
                    >
                      <p className="mb-2 font-black text-white">{item.title}</p>
                      <p className="text-sm leading-7 text-gray-400">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* How we use your data */}
              <div>
                <h2 className="mb-6 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                  What your data is used for.
                </h2>
                <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-7 space-y-4 text-sm leading-7 text-gray-300">
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
              </div>

              {/* Sub-processors */}
              <div>
                <h2 className="mb-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                  Who we share your data with.
                </h2>
                <p className="mb-6 text-sm leading-7 text-gray-400">
                  We use the following trusted sub-processors to deliver the platform.
                </p>
                <div className="grid gap-5">
                  {dataProcessors.map((p) => (
                    <div
                      key={p.name}
                      className="flex flex-col gap-3 rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="mb-1 font-black text-white">{p.name}</p>
                        <p className="text-sm leading-7 text-gray-400">{p.purpose}</p>
                      </div>
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs font-black text-purple-300 hover:text-purple-100"
                      >
                        Privacy policy →
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data retention */}
              <div>
                <h2 className="mb-6 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                  How long we keep your data.
                </h2>
                <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-7 space-y-4 text-sm leading-7 text-gray-300">
                  <p>
                    <span className="font-black text-white">Profile context</span>{" "}
                    — Stored until you delete it from your profile or delete your
                    account. You can clear CV text, role context or goals
                    individually.
                  </p>
                  <p>
                    <span className="font-black text-white">Saved practice sessions</span>{" "}
                    — Stored until you delete them individually or bulk-delete all
                    sessions from your profile page.
                  </p>
                  <p>
                    <span className="font-black text-white">Voice and camera data</span>{" "}
                    — Processed in your browser only. Never stored on our servers.
                  </p>
                  <p>
                    <span className="font-black text-white">Account data</span>{" "}
                    — Managed by Clerk. Deleting your Clerk account removes
                    authentication access. Contact us to request full data
                    deletion.
                  </p>
                </div>
              </div>

              {/* Your rights */}
              <div>
                <h2 className="mb-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                  Control your data.
                </h2>
                <p className="mb-6 text-sm leading-7 text-gray-400">
                  Under UK GDPR and applicable data protection law, you have the following rights.
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  {yourRights.map((right) => (
                    <div
                      key={right.title}
                      className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6"
                    >
                      <p className="mb-2 font-black text-white">{right.title}</p>
                      <p className="text-sm leading-7 text-gray-400">{right.text}</p>
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
              </div>

              {/* Cookies */}
              <div>
                <h2 className="mb-6 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                  Cookies and analytics.
                </h2>
                <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-7 space-y-4 text-sm leading-7 text-gray-300">
                  <p>
                    AI Career Mentor uses essential cookies for authentication
                    (set by Clerk). We do not use advertising cookies or
                    third-party tracking.
                  </p>
                  <p>
                    We collect anonymous page-view data and Core Web Vitals via
                    Vercel Analytics — no personal identity is captured.
                  </p>
                  <p>
                    If we introduce additional analytics in the future, this page
                    will be updated and you will be informed.
                  </p>
                </div>
              </div>

            </div>

            {/* Sidebar */}
            <aside className="space-y-6">

              <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6">
                <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
                  Our commitments
                </p>
                <div className="space-y-3 text-sm leading-6 text-gray-400">
                  {commitments.map((item) => (
                    <p key={item} className="flex gap-2">
                      <span className="mt-0.5 shrink-0 text-purple-400">✓</span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6">
                <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
                  Your data controls
                </p>
                <div className="space-y-3">
                  <Link href="/profile">
                    <button className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:scale-[1.02]">
                      Manage profile &amp; delete data
                    </button>
                  </Link>
                  <Link href="/terms">
                    <button className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm font-black text-gray-300 transition hover:bg-white/[0.06]">
                      Terms of use
                    </button>
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6">
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
                  Privacy contact
                </p>
                <p className="mb-2 text-sm leading-6 text-gray-400">
                  For privacy queries, data requests or complaints:
                </p>
                <p className="font-bold text-gray-200">
                  privacy@aicareermentor.co.uk
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  We aim to respond within 30 days.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6">
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-purple-200">
                  Browser permissions
                </p>
                <div className="space-y-3 text-sm leading-6 text-gray-400">
                  <p>
                    Microphone and camera access are requested only when you start
                    a voice or camera practice session. You can deny or revoke
                    these permissions at any time in your browser settings.
                  </p>
                  <p>
                    You can practise without a microphone or camera — typed
                    answers receive the same written feedback.
                  </p>
                </div>
              </div>

            </aside>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
