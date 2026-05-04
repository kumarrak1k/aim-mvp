import Link from "next/link";

const sections = [
  {
    title: "What you can save",
    text: "If you sign in and use the profile builder, you can save CV text, target role text, interview goals and related profile details so your mock interview practice can be more personalised.",
  },
  {
    title: "What happens during practice",
    text: "The interview coach uses your selected practice settings, questions, answers and optional delivery signals to generate feedback, model answers and summaries.",
  },
  {
    title: "Microphone and camera",
    text: "Voice and camera features only run when you choose to start them in your browser. Browser permissions are controlled by your device and browser settings.",
  },
  {
    title: "Your control",
    text: "You choose whether to type, use voice, enable camera, upload profile context, save profile information, or practise without a saved profile.",
  },
];

const commitments = [
  "Make profile use clear before practice starts.",
  "Show visible controls for microphone and camera actions.",
  "Avoid hiding important practice actions behind small UI elements.",
  "Keep signed-in profile areas separate from public marketing pages.",
  "Use secure browser permission prompts for voice and camera access.",
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07030d] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07030d]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-2 rounded-2xl bg-purple-500/25 blur-xl" />
              <div className="relative rounded-2xl border border-white/15 bg-white/95 p-1 shadow-lg shadow-purple-950/40">
                <img
                  src="/brand/logo.jpg"
                  alt="AI Career Mentor"
                  className="h-10 w-10 rounded-xl object-contain sm:h-11 sm:w-11"
                />
              </div>
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-[-0.03em] sm:text-lg">
                AI Career Mentor
              </p>
              <p className="hidden text-xs font-medium text-purple-100/55 sm:block">
                Privacy and data transparency
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/practice">
              <button className="rounded-full bg-white px-4 py-2.5 text-sm font-black text-black shadow-xl shadow-purple-950/20 transition hover:bg-purple-100 sm:px-5">
                Start Practice
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative">
        <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[620px] w-[920px] -translate-x-1/2 rounded-full bg-purple-700/30 blur-[140px]" />
        <div className="pointer-events-none absolute right-[-220px] top-24 h-[460px] w-[460px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute left-[-220px] top-80 h-[420px] w-[420px] rounded-full bg-fuchsia-500/15 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
          <section className="mb-8 overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-purple-950/20 backdrop-blur-2xl sm:p-8 md:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

            <div className="relative max-w-4xl">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                Privacy and data transparency
              </p>
              <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.055em] md:text-6xl">
                Clear controls for your interview practice data.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-gray-300 md:text-lg">
                AI Career Mentor is designed to make it clear when you are using
                profile context, microphone recording, camera preview and AI
                feedback. This page explains the product behaviour in plain
                English.
              </p>

              <p className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                This is a product transparency page, not formal legal advice.
                Before using it as your official privacy policy, review it against
                your actual production infrastructure, suppliers and legal
                requirements.
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <GlassSection title="How the product uses context">
                <div className="grid gap-4 md:grid-cols-2">
                  {sections.map((section) => (
                    <div
                      key={section.title}
                      className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5 shadow-xl shadow-black/10"
                    >
                      <h2 className="mb-2 text-lg font-black tracking-[-0.02em] text-white">
                        {section.title}
                      </h2>
                      <p className="text-sm leading-7 text-gray-400">
                        {section.text}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassSection>

              <GlassSection title="Important browser permissions">
                <div className="space-y-4 text-sm leading-7 text-gray-300">
                  <p>
                    Microphone and camera access require browser permission. If
                    you deny permission, you can still type answers and receive
                    written feedback. If you later want to use voice or camera,
                    change the permission in your browser or device settings.
                  </p>
                  <p>
                    On phone and tablet, the guided answer flow is designed to
                    make the action explicit: tap to hear the question and start
                    recording. Camera start may also require a separate tap on
                    some mobile browsers.
                  </p>
                </div>
              </GlassSection>

              <GlassSection title="Your choices">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ChoiceCard title="Practise without a profile" text="Type a role manually and start a practice session without saving CV context." />
                  <ChoiceCard title="Use a saved profile" text="Save CV, role and goals to make future questions and feedback more targeted." />
                  <ChoiceCard title="Type instead of speaking" text="Use the answer box only and skip browser speech recognition." />
                  <ChoiceCard title="Keep camera off" text="Disable camera analysis and practise with answer and voice only." />
                </div>
              </GlassSection>
            </div>

            <aside className="space-y-6">
              <GlassSection title="Product commitments">
                <div className="space-y-3 text-sm leading-6 text-gray-400">
                  {commitments.map((item) => (
                    <p key={item} className="flex gap-2">
                      <span className="text-purple-300">✓</span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </GlassSection>

              <GlassSection title="Suggested official policy review">
                <div className="space-y-3 text-sm leading-7 text-gray-400">
                  <p>
                    Before launch at scale, check this page against your actual
                    hosting, authentication, database, AI, analytics and payment
                    providers.
                  </p>
                  <p>
                    Add company contact details, data retention rules and any
                    jurisdiction-specific privacy wording required for your
                    business.
                  </p>
                </div>
              </GlassSection>

              <GlassSection title="Continue preparing">
                <div className="space-y-3">
                  <Link href="/practice">
                    <button className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]">
                      Start practice
                    </button>
                  </Link>
                  <Link href="/profile">
                    <button className="w-full rounded-2xl border border-purple-300/20 bg-purple-300/10 px-5 py-3 text-sm font-black text-purple-100 transition hover:bg-purple-300/15">
                      Manage profile
                    </button>
                  </Link>
                </div>
              </GlassSection>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}

function GlassSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.065] p-5 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="relative">
        <h2 className="mb-4 text-2xl font-black tracking-[-0.035em] text-white">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function ChoiceCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="font-black text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-gray-400">{text}</p>
    </div>
  );
}
