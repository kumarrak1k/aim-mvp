import type { Metadata } from "next";
import Link from "next/link";
import { unsubscribeByToken } from "@/app/lib/emailPreferences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe | AI Career Mentor",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

export default async function UnsubscribePage({ params }: Props) {
  const { token } = await params;
  const result = await unsubscribeByToken(token).catch(() => ({ ok: false as const }));

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#0a0614] px-4 text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.10),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.06),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-8 text-center shadow-2xl">
        {result.ok ? (
          <>
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15 text-2xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              You&rsquo;ve been unsubscribed
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              You won&rsquo;t receive any more marketing or tips emails from AI
              Career Mentor. You&rsquo;ll still get essential account emails
              (like security and billing notices) where required.
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Changed your mind? You can re-enable tips any time from your
              notification settings.
            </p>
            <Link
              href="/account/notifications"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
            >
              Manage notification settings →
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-2xl">
              ?
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Link not recognised
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              This unsubscribe link is invalid or has expired. You can manage all
              your email preferences from your account settings instead.
            </p>
            <Link
              href="/account/notifications"
              className="mt-6 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]"
            >
              Go to notification settings →
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
