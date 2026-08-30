"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

/**
 * /change-password
 *
 * Shown to admin-created users on their first sign-in.
 * They are routed here by app/auth/redirect/page.tsx when
 * privateMetadata.forcePasswordReset === true.
 *
 * Uses the backend API (POST /api/account/change-password) to update
 * the password server-side — this avoids requiring the temporary
 * password to be re-entered as a "current password" on the client.
 *
 * After success the flag is cleared and the user is sent to their portal.
 */
export default function ChangePasswordPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [done, setDone]                       = useState(false);

  // Redirect away if user is not signed in (once Clerk has loaded)
  useEffect(() => {
    if (isLoaded && !user) router.replace("/");
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-fuchsia-500 border-t-transparent" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const json = await res.json() as { success?: boolean; error?: string; redirectTo?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to update password. Please try again.");
        return;
      }
      setDone(true);
      // Navigate directly to the user's portal — skip /auth/redirect to avoid
      // a Clerk metadata propagation race that would loop back to this page.
      const destination = json.redirectTo ?? "/practice";
      setTimeout(() => router.push(destination), 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-tight text-white">
            AI Career Mentor
          </span>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-sm">
          {done ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-bold text-white">Password set!</p>
              <p className="mt-1 text-sm text-gray-400">Taking you to your account…</p>
            </div>
          ) : (
            <>
              <p className="text-[12px] font-bold tracking-wide text-fuchsia-300">
                Action required
              </p>
              <h1 className="mt-1 text-xl font-bold text-white">Set your password</h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                Your account was created by an administrator with a temporary password.
                Please set a permanent password before continuing.
              </p>

              <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
                <div>
                  <label className="block text-[12px] font-bold tracking-wide text-gray-400">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={loading}
                    autoComplete="new-password"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:border-fuchsia-400/40 focus:outline-none disabled:opacity-50"
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold tracking-wide text-gray-400">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={loading}
                    autoComplete="new-password"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:border-fuchsia-400/40 focus:outline-none disabled:opacity-50"
                    placeholder="Repeat your new password"
                  />
                </div>

                {error && (
                  <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="mt-2 w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 py-3 text-sm font-bold text-on-accent shadow-lg transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Setting password…" : "Set password & continue →"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-[12px] text-gray-700">
          AI Career Mentor · Your password is encrypted and never stored in plain text.
        </p>
      </div>
    </div>
  );
}
