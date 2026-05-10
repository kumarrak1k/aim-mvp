"use client";

import { useEffect, useState } from "react";

/**
 * PlanPage — rendered inside the Clerk UserButton modal as a custom profile
 * page. Shows the user's current plan, trial usage, and upgrade / manage
 * actions.
 *
 * This component intentionally uses no shared context — it fetches its own
 * data so it works correctly in the Clerk portal iframe.
 */

type SubscriptionInfo = {
  planName: string;
  isActive: boolean;
  planId: string | null;
  currentPeriodEnd: string | null;
  hasCustomer: boolean;
};

type UsageInfo = {
  planName: string;
  dailyLimit: number | null;
  usedToday: number;
  remainingToday: number | null;
  limitReached: boolean;
};

const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

export function PlanPage() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/subscription").then((r) => r.json()),
      fetch("/api/practice-sessions").then((r) => r.json()),
    ])
      .then(([subData, sessData]: [SubscriptionInfo, { usage?: UsageInfo }]) => {
        setSub(subData);
        if (sessData?.usage) setUsage(sessData.usage);
      })
      .catch(() => setError("Could not load plan information."))
      .finally(() => setLoading(false));
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Could not open billing portal. Contact support.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  async function upgradeToPlan(planId: string) {
    setCheckoutLoading(planId);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Could not start checkout. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-14">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  // ─── Plan state ───────────────────────────────────────────────────────────

  const isFree = !sub?.isActive || sub.planName === "Free";
  const isProfessional = sub?.planName === "Professional";

  const totalLimit = usage?.dailyLimit ?? 3;
  const totalUsed = usage?.usedToday ?? 0;
  const remaining = usage?.remainingToday ?? Math.max(0, totalLimit - totalUsed);
  const progressPct = Math.min(100, (totalUsed / totalLimit) * 100);
  const limitReached = usage?.limitReached ?? false;

  const periodEndDate = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div style={{ fontFamily: "inherit" }} className="space-y-5 text-sm">

      {/* ── Current plan card ───────────────────────────────────────────── */}
      <div
        style={{
          borderRadius: "1rem",
          border: isFree ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(168,85,247,0.3)",
          background: isFree ? "rgba(255,255,255,0.03)" : "rgba(168,85,247,0.07)",
          padding: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <p style={{ fontSize: "0.65rem", fontWeight: 900, letterSpacing: "0.18em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.35rem" }}>
              Current plan
            </p>
            <p style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.04em", color: "white", lineHeight: 1 }}>
              {sub?.planName ?? "Free"}
            </p>
          </div>

          <span
            style={{
              borderRadius: "999px",
              padding: "0.25rem 0.75rem",
              fontSize: "0.65rem",
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              background: isFree
                ? "rgba(255,255,255,0.08)"
                : "linear-gradient(to right, #a855f7, #ec4899)",
              color: isFree ? "rgba(255,255,255,0.6)" : "white",
              flexShrink: 0,
              marginTop: "0.25rem",
            }}
          >
            {isFree ? "Trial" : "Active"}
          </span>
        </div>

        {/* Free plan — usage bar */}
        {isFree && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Trial sessions used</span>
              <span style={{ fontWeight: 900, color: "white" }}>
                {totalUsed} / {totalLimit}
              </span>
            </div>
            <div style={{ height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: "999px",
                  width: `${progressPct}%`,
                  background: limitReached
                    ? "linear-gradient(to right, #f87171, #ef4444)"
                    : "linear-gradient(to right, #a855f7, #ec4899)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <p style={{ marginTop: "0.4rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
              {limitReached
                ? "All trial sessions used — upgrade to continue practising."
                : `${remaining} session${remaining === 1 ? "" : "s"} remaining · keyboard mode only`}
            </p>
          </div>
        )}

        {/* Paid plan — renewal info */}
        {!isFree && (
          <div style={{ marginTop: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
            <p>Unlimited sessions · All interview modes</p>
            {periodEndDate && (
              <p style={{ marginTop: "0.25rem" }}>Renews {periodEndDate}</p>
            )}
          </div>
        )}
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────── */}

      {PAYMENTS_ENABLED && isFree && (
        <div>
          <p style={{ fontSize: "0.65rem", fontWeight: 900, letterSpacing: "0.16em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Upgrade your plan
          </p>

          {/* Professional */}
          <button
            onClick={() => void upgradeToPlan("professional_monthly")}
            disabled={checkoutLoading !== null}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "0.85rem",
              border: "1px solid rgba(168,85,247,0.25)",
              background: "rgba(168,85,247,0.07)",
              padding: "0.85rem 1rem",
              marginBottom: "0.5rem",
              cursor: checkoutLoading ? "not-allowed" : "pointer",
              opacity: checkoutLoading ? 0.6 : 1,
              textAlign: "left",
            }}
          >
            <div>
              <p style={{ fontWeight: 900, color: "white", marginBottom: "0.15rem" }}>Professional</p>
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>
                Unlimited · Voice · Camera · from £19/mo
              </p>
            </div>
            <span style={{ fontSize: "0.72rem", fontWeight: 900, color: "#c084fc", flexShrink: 0, marginLeft: "1rem" }}>
              {checkoutLoading === "professional_monthly" ? "…" : "Upgrade →"}
            </span>
          </button>

          {/* Advanced */}
          <button
            onClick={() => void upgradeToPlan("advanced_monthly")}
            disabled={checkoutLoading !== null}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "0.85rem",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              padding: "0.85rem 1rem",
              marginBottom: "0.5rem",
              cursor: checkoutLoading ? "not-allowed" : "pointer",
              opacity: checkoutLoading ? 0.6 : 1,
              textAlign: "left",
            }}
          >
            <div>
              <p style={{ fontWeight: 900, color: "white", marginBottom: "0.15rem" }}>Advanced</p>
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>
                Everything + Assessment Centre · from £29/mo
              </p>
            </div>
            <span style={{ fontSize: "0.72rem", fontWeight: 900, color: "rgba(255,255,255,0.5)", flexShrink: 0, marginLeft: "1rem" }}>
              {checkoutLoading === "advanced_monthly" ? "…" : "Upgrade →"}
            </span>
          </button>

          <p style={{ textAlign: "center", fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginTop: "0.5rem" }}>
            <a href="/for-candidates/pricing" style={{ color: "#c084fc" }}>
              See annual plans and full pricing →
            </a>
          </p>
        </div>
      )}

      {/* Paid — upgrade to Advanced + manage billing */}
      {PAYMENTS_ENABLED && !isFree && (
        <div>
          {isProfessional && (
            <button
              onClick={() => void upgradeToPlan("advanced_monthly")}
              disabled={checkoutLoading !== null}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: "0.85rem",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                padding: "0.85rem 1rem",
                marginBottom: "0.5rem",
                cursor: checkoutLoading ? "not-allowed" : "pointer",
                opacity: checkoutLoading ? 0.6 : 1,
                textAlign: "left",
              }}
            >
              <div>
                <p style={{ fontWeight: 900, color: "white", marginBottom: "0.15rem" }}>Upgrade to Advanced</p>
                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>
                  Adds Assessment Centre + analytics · from £29/mo
                </p>
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 900, color: "rgba(255,255,255,0.5)", flexShrink: 0, marginLeft: "1rem" }}>
                {checkoutLoading === "advanced_monthly" ? "…" : "Switch →"}
              </span>
            </button>
          )}

          {/* Manage billing (Stripe portal) */}
          <button
            onClick={() => void openPortal()}
            disabled={portalLoading}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "0.85rem",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              padding: "0.85rem 1rem",
              cursor: portalLoading ? "not-allowed" : "pointer",
              opacity: portalLoading ? 0.6 : 1,
              textAlign: "left",
            }}
          >
            <div>
              <p style={{ fontWeight: 900, color: "white", marginBottom: "0.15rem" }}>Manage billing</p>
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>
                Cancel, update payment method or download invoices
              </p>
            </div>
            <span style={{ fontSize: "0.72rem", fontWeight: 900, color: "rgba(255,255,255,0.5)", flexShrink: 0, marginLeft: "1rem" }}>
              {portalLoading ? "…" : "Open →"}
            </span>
          </button>
        </div>
      )}

      {/* Payments not enabled (dev mode) */}
      {!PAYMENTS_ENABLED && isFree && (
        <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
          Payments are not enabled in this environment.
        </p>
      )}

      {error && (
        <p style={{ fontSize: "0.72rem", color: "#f87171", marginTop: "0.5rem" }}>{error}</p>
      )}
    </div>
  );
}
