"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SubscriptionInfo = {
  planName: string;
  isActive: boolean;
  isPastDue: boolean;
  planId: string | null;
  currentPeriodEnd: string | null;
  hasCustomer: boolean;
};

const PLAN_COLOURS: Record<string, string> = {
  Professional: "text-fuchsia-300 border-fuchsia-300/20 bg-fuchsia-300/[0.06]",
  Plus: "text-purple-300 border-purple-300/20 bg-purple-300/[0.06]",
  Free: "text-gray-400 border-white/10 bg-white/[0.03]",
};

export function SubscriptionCard() {
  const router = useRouter();
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => setInfo(d))
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleManageBilling() {
    setManaging(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url } = await res.json();
      if (url) router.push(url);
    } finally {
      setManaging(false);
    }
  }

  if (loading) return null;
  if (!info) return null;

  const colourClass = PLAN_COLOURS[info.planName] ?? PLAN_COLOURS.Free;
  const renewalDate = info.currentPeriodEnd
    ? new Date(info.currentPeriodEnd).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className={`mb-6 rounded-[2rem] border p-6 ${colourClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-bold tracking-wide opacity-60">
            Current plan
          </p>
          <p className="text-xl font-bold tracking-tight">{info.planName}</p>
          {renewalDate && !info.isPastDue && (
            <p className="mt-1 text-xs opacity-60">Renews {renewalDate}</p>
          )}
          {info.isPastDue && (
            <p className="mt-1 text-xs font-bold text-amber-300">
              ⚠ Payment failed. Update your card to keep access.
            </p>
          )}
          {!info.isActive && (
            <p className="mt-1 text-xs opacity-60">
              3 keyboard-only practice sessions · No payment details required
            </p>
          )}
        </div>

        {info.isActive ? (
          <button
            onClick={handleManageBilling}
            disabled={managing}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50 ${
              info.isPastDue
                ? "bg-amber-400 text-[#3a2a00] hover:scale-[1.02]"
                : "border border-white/10 bg-white/[0.06] hover:bg-white/[0.1]"
            }`}
          >
            {managing ? "Loading…" : info.isPastDue ? "Update card" : "Manage billing"}
          </button>
        ) : (
          <Link
            href="/pricing"
            className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
          >
            Upgrade
          </Link>
        )}
      </div>
    </div>
  );
}
