import Link from "next/link";
import type { Metadata } from "next";
import { CandidateShell } from "@/app/components/marketing/CandidateShell";

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
    text: "When you use voice mode, live transcription uses your browser's built-in speech recognition (Chrome/Chromium use Google, Edge uses Microsoft, Safari uses Apple; Firefox is unsupported). Separately, for filler-word and voice-delivery analysis, a short audio clip is sent to OpenAI's Whisper API, transcribed, and then discarded; it is not stored on our servers. Voice mode is entirely optional; typed answers receive identical feedback and send no audio anywhere.",
  },
  {
    title: "Camera input",
    text: "Camera video processed locally in your browser for presence signals. Raw video frames are never sent to our servers or stored.",
  },
];

const dataProcessors = [
  {
    name: "OpenAI",
    purpose: "Generates interview questions, feedback, scores, model answers, and audio question prompts (TTS). Also used for content moderation. Your CV text, role details, and practice answers are sent to OpenAI's API to deliver these features. We have disabled all data-sharing and model-training settings in our OpenAI account. OpenAI's API terms prohibit using API inputs to train models. Data is processed under a Data Processing Agreement.",
    link: "https://openai.com/policies/privacy-policy",
  },
  {
    name: "Clerk",
    purpose: "Handles authentication, account management and session tokens for both candidates and hiring teams. Stores your email address, name, and account metadata. No interview content or CV data is stored by Clerk.",
    link: "https://clerk.com/legal/privacy",
  },
  {
    name: "Neon / PostgreSQL",
    purpose: "Stores your saved practice sessions, scores, feedback, candidate profile context, and corporate assessment data in a managed PostgreSQL database hosted on AWS eu-west-2 (London, UK).",
    link: "https://neon.tech/privacy-policy",
  },
  {
    name: "Stripe",
    purpose: "Handles payment processing for individual and corporate subscriptions. Receives your email address and billing details. No interview content, CV data, or assessment responses are ever shared with Stripe.",
    link: "https://stripe.com/gb/privacy",
  },
  {
    name: "Resend",
    purpose: "Sends transactional emails such as assessment invite links, account notifications, and result emails. Receives your email address only. No CV content, interview answers, or assessment scores are included in any email.",
    link: "https://resend.com/legal/privacy-policy",
  },
  {
    name: "Upstash Redis",
    purpose: "Provides in-memory rate limiting across API endpoints to protect the platform from abuse. Receives anonymised request identifiers (a hash of your IP address or user ID) only. No personal content, CV data, or interview answers are stored.",
    link: "https://upstash.com/trust/privacy.pdf",
  },
  {
    name: "Sentry",
    purpose: "Error monitoring and alerting. When an unexpected application error occurs, Sentry receives a crash report that may include a stack trace and partial request context. We apply PII scrubbing rules to prevent CV content, interview answers, or personal profile data from appearing in error logs. Sentry does not receive audio or video data.",
    link: "https://sentry.io/privacy/",
  },
  {
    name: "Vercel",
    purpose: "Hosts and serves all pages and API routes for the AI Career Mentor platform. Collects anonymous page-view analytics and Core Web Vitals via Vercel Analytics and Speed Insights. No personal identity data is captured by these tools.",
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
    text: "You can opt out of tips and practice reminders with one click in any email, or from the notifications page in your account. You can stop using the platform at any time, and deleting your account removes access to your data.",
  },
  {
    title: "Opt out of tips & reminders",
    text: "When you sign up we may email you interview tips, practice nudges and trial reminders about AI Career Mentor (and nothing else). You can refuse at sign-up, unsubscribe from any email with one click, or turn them off in your notification settings. Essential account and billing emails are always sent.",
  },
];

const commitments = [
  "We do not sell your personal information.",
  "We do not use your interview answers or CV to make hiring decisions.",
  "We do not share your data with employers.",
  "Raw uploaded files are not stored: only extracted text you choose to save.",
  "Camera video stays in your browser and is never uploaded: analysis runs locally.",
  "Voice audio for delivery analysis is sent to OpenAI Whisper, transcribed, then discarded, never stored on our servers.",
  "Error monitoring uses PII scrubbing to keep interview content out of logs.",
  "You control deletion of all your practice data from your profile.",
];

export default function PrivacyPage() {
  return (
    <CandidateShell currentPath="/privacy">
      <div>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 pb-12 pt-1 text-center sm:px-6 sm:pt-3">
          <h1 className="mx-auto max-w-3xl text-[2.2rem] font-bold leading-[1.06] tracking-tight sm:text-4xl">
            Your interview data{" "}
            <span className="text-violet-300">
              belongs to you.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-gray-400">
            We collect only what is necessary to deliver personalised interview
            coaching. This page explains exactly what we collect, how we use it,
            who we share it with, and how to delete it.
          </p>
          <p className="mx-auto mt-5 max-w-xl rounded-2xl border border-amber-300/15 bg-amber-300/[0.08] px-5 py-3 text-sm leading-6 text-amber-100">
            For questions contact{" "}
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
                <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
                  Data we hold about you.
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  {dataWeCollect.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6"
                    >
                      <p className="mb-2 font-bold text-white">{item.title}</p>
                      <p className="text-sm leading-7 text-gray-400">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* How we use your data */}
              <div>
                <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
                  What your data is used for.
                </h2>
                <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-7 space-y-4 text-sm leading-7 text-gray-300">
                  <p>
                    Your profile context (CV text, role details, goals) and
                    practice answers are sent to OpenAI to generate personalised
                    interview questions, feedback, scores, and session summaries.
                    OpenAI is also used to generate spoken question audio (TTS)
                    and to screen content through its moderation API. This is
                    necessary to deliver the core coaching features.
                  </p>
                  <p>
                    We have disabled all data-sharing and training settings in our
                    OpenAI account. OpenAI&apos;s API terms prohibit using API
                    inputs to train models, and we operate under a Data Processing
                    Agreement with OpenAI.
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
                    Camera presence signals are generated locally in your browser
                    using MediaPipe (a client-side library). No video frames are
                    ever transmitted to our servers or to any third party.
                  </p>
                  <p>
                    Rate limiting uses Upstash Redis to store anonymised request
                    identifiers only. No personal data or content is stored there.
                    Error monitoring via Sentry receives crash reports with PII
                    scrubbing applied to prevent interview or CV content from
                    appearing in logs.
                  </p>
                  <p className="font-semibold text-white">
                    Your data is never used to train AI models, never sold to
                    third parties, and never shared with employers.
                  </p>
                </div>
              </div>

              {/* Sub-processors */}
              <div>
                <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
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
                        <p className="mb-1 font-bold text-white">{p.name}</p>
                        <p className="text-sm leading-7 text-gray-400">{p.purpose}</p>
                      </div>
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs font-bold text-purple-300 hover:text-purple-100"
                      >
                        Privacy policy →
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data retention */}
              <div>
                <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
                  How long we keep your data.
                </h2>
                <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-7 space-y-4 text-sm leading-7 text-gray-300">
                  <p>
                    <span className="font-bold text-white">Profile context</span>:{" "}
                    Stored until you delete it from your profile or delete your
                    account. You can clear CV text, role context or goals
                    individually.
                  </p>
                  <p>
                    <span className="font-bold text-white">Saved practice sessions</span>:{" "}
                    Stored until you delete them individually or bulk-delete all
                    sessions from your profile page.
                  </p>
                  <p>
                    <span className="font-bold text-white">Voice and camera data</span>:{" "}
                    Processed in your browser only. Never stored on our servers.
                  </p>
                  <p>
                    <span className="font-bold text-white">Account data</span>:{" "}
                    Managed by Clerk. Deleting your Clerk account removes
                    authentication access. Contact us to request full data
                    deletion.
                  </p>
                </div>
              </div>

              {/* Analytics */}
              <div>
                <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
                  Analytics and how you use the site.
                </h2>
                <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-7 space-y-4 text-sm leading-7 text-gray-300">
                  <p>
                    <span className="font-bold text-white">Only if you accept analytics.</span>{" "}
                    When you choose &ldquo;Accept analytics&rdquo; on the cookie
                    banner, and only then, we record how you use the site while
                    signed in: the pages you visit, how long you spend on each
                    one, the features you open, and the questions you ask the AI
                    mentor. This is linked to your account.
                  </p>
                  <p>
                    <span className="font-bold text-white">Why we collect it.</span>{" "}
                    To find where people get stuck and fix it. If candidates
                    consistently abandon a particular step, we want to know which
                    step and how long they struggled before leaving. We do not use
                    it for advertising, we do not build marketing profiles, and we
                    never sell it.
                  </p>
                  <p>
                    <span className="font-bold text-white">Your legal basis.</span>{" "}
                    Consent. If you choose &ldquo;Essential only&rdquo;, none of
                    this is collected — not anonymously, not at all. Declining has
                    no effect on your access to any feature.
                  </p>
                  <p>
                    <span className="font-bold text-white">How long we keep it.</span>{" "}
                    Analytics records are deleted after 12 months. Deleting your
                    account removes them immediately.
                  </p>
                  <p>
                    <span className="font-bold text-white">Changing your mind.</span>{" "}
                    You can withdraw consent at any time by clearing this
                    site&rsquo;s data in your browser, which makes the banner
                    reappear so you can choose again. Withdrawal stops collection
                    straight away. To have analytics already collected about you
                    erased, contact us and we will delete it.
                  </p>
                  <p>
                    <span className="font-bold text-white">Who can see it.</span>{" "}
                    Only us. Analytics is visible to our administrators to
                    diagnose problems with the product, and is not shared with any
                    third party for their own purposes.
                  </p>
                  <p>
                    Separately, and regardless of your choice, we keep a record of
                    the practice sessions and assessments you complete. That is
                    part of the service itself rather than analytics: it is what
                    powers your progress history, and you can delete it from your
                    profile at any time.
                  </p>
                </div>
              </div>

              {/* Email you receive */}
              <div>
                <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
                  Emails we send you.
                </h2>
                <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-7 space-y-4 text-sm leading-7 text-gray-300">
                  <p>
                    <span className="font-bold text-white">Service emails</span>:{" "}
                    Account, security, trial status, assessment invitations and
                    payment receipts. These are part of running your account, so
                    they are always sent while your account exists.
                  </p>
                  <p>
                    <span className="font-bold text-white">Interview tips and practice reminders</span>:{" "}
                    Because you signed up for AI Career Mentor, we may email you
                    tips and reminders about this service under the soft opt-in
                    rule in the Privacy and Electronic Communications Regulations.
                    You are offered the choice to decline when you create your
                    account, every email has a one-click unsubscribe, and you can
                    change your preference at any time on your notifications page.
                    We only email you about our own service.
                  </p>
                  <p>
                    <span className="font-bold text-white">No selling or sharing</span>:{" "}
                    We never sell your email address and never pass it to third
                    parties for their own marketing.
                  </p>
                </div>
              </div>

              {/* Your rights */}
              <div>
                <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
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
                      <p className="mb-2 font-bold text-white">{right.title}</p>
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
                <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
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
                    Vercel Analytics. No personal identity is captured.
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
                <p className="mb-4 text-[12px] font-bold tracking-wide text-purple-200">
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
                <p className="mb-4 text-[12px] font-bold tracking-wide text-purple-200">
                  Your data controls
                </p>
                <div className="space-y-3">
                  <Link href="/profile">
                    <button className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]">
                      Manage profile &amp; delete data
                    </button>
                  </Link>
                  <Link href="/terms">
                    <button className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/[0.06]">
                      Terms of use
                    </button>
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6">
                <p className="mb-3 text-[12px] font-bold tracking-wide text-purple-200">
                  Data controller
                </p>
                <p className="mb-1 font-bold text-gray-200">AI Career Mentor Ltd</p>
                <p className="text-xs text-gray-400">
                  Registered in England &amp; Wales<br />Company No. 17288119
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6">
                <p className="mb-3 text-[12px] font-bold tracking-wide text-purple-200">
                  Privacy contact
                </p>
                <p className="mb-2 text-sm leading-6 text-gray-400">
                  For privacy queries, data requests or complaints:
                </p>
                <p className="font-bold text-gray-200">
                  privacy@aicareermentor.co.uk
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  We aim to respond within 30 days.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6">
                <p className="mb-3 text-[12px] font-bold tracking-wide text-purple-200">
                  Browser permissions
                </p>
                <div className="space-y-3 text-sm leading-6 text-gray-400">
                  <p>
                    Microphone and camera access are requested only when you start
                    a voice or camera practice session. You can deny or revoke
                    these permissions at any time in your browser settings.
                  </p>
                  <p>
                    You can practise without a microphone or camera. Typed
                    answers receive the same written feedback.
                  </p>
                </div>
              </div>

            </aside>
          </div>
        </section>
      </div>
    </CandidateShell>
  );
}
