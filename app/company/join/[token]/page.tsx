"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type InviteInfo = {
  companyName: string;
  role: string;
  email: string;
  expiresAt: string;
};

type Phase = "loading" | "ready" | "accepting" | "success" | "error";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  recruiter: "Recruiter",
  viewer: "Viewer",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Full workspace access including billing and team management.",
  recruiter: "Can create assessment templates and invite candidates.",
  viewer: "Read-only access to templates, candidates and results.",
};

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === "string" ? params.token : "";

  const [phase, setPhase] = useState<Phase>("loading");
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Load invite info on mount
  useEffect(() => {
    if (!token) { setPhase("error"); setErrorMsg("Invalid invite link."); return; }

    fetch(`/api/company/join?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setPhase("error"); setErrorMsg(data.error); return; }
        setInvite(data.invite);
        setPhase("ready");
      })
      .catch(() => { setPhase("error"); setErrorMsg("Could not load invite. Please check your link."); });
  }, [token]);

  async function acceptInvite() {
    setPhase("accepting");
    try {
      const res = await fetch("/api/company/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        // 401 → not signed in → send to corporate sign-in with returnUrl
        if (res.status === 401) {
          router.push(`/for-business/sign-in?returnUrl=${encodeURIComponent(`/company/join/${token}`)}`);
          return;
        }
        setPhase("error");
        setErrorMsg(data.error || "Failed to accept invite.");
        return;
      }
      setPhase("success");
    } catch {
      setPhase("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="AI Career Mentor"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl"
              />
              <span className="text-lg font-bold tracking-tight text-white">AI Career Mentor</span>
            </div>
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/20">
          {/* Loading */}
          {phase === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
              <p className="text-sm text-gray-400">Loading invite…</p>
            </div>
          )}

          {/* Error */}
          {phase === "error" && (
            <div className="text-center">
              <p className="text-4xl">🔗</p>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Invite unavailable</h1>
              <p className="mt-3 text-sm text-gray-400">{errorMsg}</p>
              <p className="mt-2 text-xs text-gray-400">Ask your workspace admin to send a new invite link.</p>
              <Link
                href="/for-business"
                className="mt-6 inline-block rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.09]"
              >
                Back to home
              </Link>
            </div>
          )}

          {/* Ready — show invite details */}
          {(phase === "ready" || phase === "accepting") && invite && (
            <>
              <p className="text-[12px] font-bold tracking-wide text-fuchsia-300">
                Workspace invitation
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
                You&apos;re invited to join
              </h1>
              <p className="mt-1 text-xl font-bold text-fuchsia-200">{invite.companyName}</p>

              <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/20 text-sm font-bold text-fuchsia-300">
                    {(ROLE_LABELS[invite.role] ?? invite.role)[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {ROLE_LABELS[invite.role] ?? invite.role}
                    </p>
                    <p className="text-xs text-gray-400">
                      {ROLE_DESCRIPTIONS[invite.role] ?? "Team member access."}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[12px] text-gray-400">
                  Invite sent to{" "}
                  <span className="text-gray-300">{invite.email}</span>
                  {" · "}expires{" "}
                  {new Date(invite.expiresAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <p className="mt-4 text-xs text-gray-400">
                You must be signed in with a hiring team account to accept. If you don&apos;t have one yet, you&apos;ll be asked to create one first.
              </p>

              <button
                onClick={() => void acceptInvite()}
                disabled={phase === "accepting"}
                className="mt-6 flex w-full justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-5 py-3.5 text-sm font-bold text-on-accent shadow-xl shadow-fuchsia-950/35 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {phase === "accepting" ? "Accepting…" : `Accept invitation →`}
              </button>

              <p className="mt-3 text-center text-[12px] text-gray-400">
                By accepting you agree to our{" "}
                <Link href="/terms" className="underline hover:text-gray-400">Terms</Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline hover:text-gray-400">Privacy policy</Link>.
              </p>
            </>
          )}

          {/* Success */}
          {phase === "success" && invite && (
            <div className="text-center">
              <p className="text-4xl">🎉</p>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
                You&apos;re in!
              </h1>
              <p className="mt-2 text-sm text-gray-300">
                You&apos;ve joined <span className="font-bold text-white">{invite.companyName}</span> as{" "}
                <span className="font-bold text-white">{ROLE_LABELS[invite.role] ?? invite.role}</span>.
              </p>
              <button
                onClick={() => router.push("/company/dashboard")}
                className="mt-6 flex w-full justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-5 py-3.5 text-sm font-bold text-on-accent shadow-xl shadow-fuchsia-950/35 transition hover:scale-[1.02]"
              >
                Go to dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
