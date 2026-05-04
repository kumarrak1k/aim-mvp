import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07030d] text-white">
      <div className="relative flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
        <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[620px] w-[920px] -translate-x-1/2 rounded-full bg-purple-700/30 blur-[140px]" />
        <div className="pointer-events-none absolute right-[-220px] top-24 h-[460px] w-[460px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute left-[-220px] top-80 h-[420px] w-[420px] rounded-full bg-fuchsia-500/15 blur-[120px]" />

        <section className="relative w-full max-w-3xl overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.07] p-6 text-center shadow-2xl shadow-purple-950/20 backdrop-blur-2xl sm:p-8 md:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          <div className="mx-auto mb-6 w-fit rounded-[1.5rem] border border-white/15 bg-white p-2 shadow-2xl shadow-purple-950/40">
            <img
              src="/brand/logo.jpg"
              alt="AI Career Mentor"
              className="h-16 w-16 rounded-2xl object-contain"
            />
          </div>

          <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-purple-300">
            Page not found
          </p>

          <h1 className="text-4xl font-black tracking-[-0.055em] md:text-6xl">
            This route has missed the interview.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-gray-300">
            The page you are looking for does not exist, has moved, or is not
            available yet. Head back to the platform and continue preparing.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/practice">
              <button className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] sm:w-auto">
                Start practice
              </button>
            </Link>

            <Link href="/">
              <button className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-7 py-4 text-sm font-black text-white transition hover:bg-white/[0.1] sm:w-auto">
                Back to homepage
              </button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
