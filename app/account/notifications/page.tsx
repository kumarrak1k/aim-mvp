"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

/**
 * Authed notification settings — lets a candidate turn marketing / tips emails
 * on or off. Essential account emails (security, billing, assessment invites,
 * trial-expiry notices) are always sent and are not controlled here.
 */
export default function NotificationSettingsPage() {
  const [consent, setConsent] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetch("/api/email-preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.marketingConsent === "boolean") setConsent(d.marketingConsent);
        else setConsent(true);
      })
      .catch(() => setConsent(true));
  }, []);

  async function update(next: boolean) {
    setConsent(next);
    setSaving(true);
    setSavedMsg("");
    setError("");
    try {
      const res = await fetch("/api/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketingConsent: next, source: "preferences" }),
      });
      if (!res.ok) throw new Error();
      setSavedMsg("Saved.");
    } catch {
      setError("Couldn't save. Please try again.");
      setConsent(!next); // revert
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      if (res.ok) {
        window.location.href = "/?deleted=1";
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setDeleteError(data.error ?? "Couldn't delete your account.");
      setDeleting(false);
    } catch {
      setDeleteError("Couldn't delete your account. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-[#0a0614] px-4 py-10 text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.18),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.12),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <SiteLogo href="/practice" size="md" showText />
          <Link href="/practice" className="text-sm text-gray-400 hover:text-white">
            ← Back to practice
          </Link>
        </div>

        <h1 className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">
          Email notifications
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Choose what we email you. You can change this any time.
        </p>

        <div className="mt-8 rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-6">
          {/* Marketing toggle */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-black">Tips &amp; product emails</p>
              <p className="mt-1 text-sm leading-6 text-gray-400">
                Interview tips, practice nudges, trial reminders and occasional
                product updates.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={consent === true}
              disabled={consent === null || saving}
              onClick={() => update(!(consent ?? true))}
              className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition disabled:opacity-50 ${
                consent
                  ? "border-purple-400/40 bg-purple-500/40"
                  : "border-white/10 bg-white/[0.07]"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  consent ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="my-5 h-px bg-white/[0.07]" />

          {/* Always-on transactional */}
          <div className="flex items-start justify-between gap-4 opacity-70">
            <div>
              <p className="font-black">Essential account emails</p>
              <p className="mt-1 text-sm leading-6 text-gray-400">
                Security, billing, assessment invites and trial-status notices.
                These are always sent and can&rsquo;t be turned off.
              </p>
            </div>
            <span className="mt-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-gray-400">
              Always on
            </span>
          </div>

          <div className="mt-5 h-5 text-sm">
            {savedMsg && <span className="font-semibold text-emerald-300">{savedMsg}</span>}
            {error && <span className="font-semibold text-amber-300">{error}</span>}
          </div>
        </div>

        {/* Danger zone — account deletion (GDPR right to erasure) */}
        <div className="mt-8 rounded-[1.5rem] border border-red-500/25 bg-red-500/[0.04] p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-red-300">
            Danger zone
          </p>
          <h2 className="mt-2 text-lg font-black">Delete your account</h2>
          <p className="mt-1 text-sm leading-6 text-gray-400">
            Permanently deletes your account and all personal data — profile, saved
            practice sessions, career docs and email preferences. Assessment results
            you completed for an employer are retained by that employer. This cannot
            be undone.
          </p>
          <label className="mt-4 block text-xs font-black uppercase tracking-wider text-gray-400">
            Type DELETE to confirm
          </label>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white placeholder:text-gray-600 focus:border-red-400/40 focus:outline-none"
          />
          <button
            onClick={deleteAccount}
            disabled={deleteConfirm !== "DELETE" || deleting}
            className="mt-4 rounded-full bg-red-500/90 px-5 py-2.5 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Permanently delete my account"}
          </button>
          {deleteError && (
            <p className="mt-3 text-sm font-semibold text-amber-300">{deleteError}</p>
          )}
        </div>
      </div>
    </main>
  );
}
