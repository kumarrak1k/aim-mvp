"use client";

import { useEffect, useState } from "react";

/**
 * PlanPage — rendered inside the Clerk UserButton modal as a custom profile
 * page. Shows the user's current plan and provides in-app upgrade / downgrade
 * / cancellation controls.
 *
 * Rules enforced:
 *   Monthly plan  → upgrade:   immediate, prorated
 *   Monthly plan  → downgrade: deferred to end of billing cycle
 *   Monthly plan  → free:      cancel at period end
 *   Annual plan   → free:      cancel at period end (access until annual end)
 *   Annual plan   → other:     redirected to Stripe portal (too complex in-app)
 */

type SubscriptionInfo = {
  planName: string;
  isActive: boolean;
  planId: string | null;
  currentPeriodEnd: string | null;
  hasCustomer: boolean;
  billingInterval: "monthly" | "annual" | null;
  cancelAtPeriodEnd: boolean;
  // Reverse-trial state
  isTrial?: boolean;
  isPaid?: boolean;
  isPastDue?: boolean;
  paidPlanName?: string;
  trialEndsAt?: string | null;
  trialDaysRemaining?: number;
  trialConsumed?: boolean;
};

type UsageInfo = {
  planName: string;
  dailyLimit: number | null;
  usedToday: number;
  remainingToday: number | null;
  limitReached: boolean;
};

type ConfirmState = {
  action: string;
  targetPlanId?: string;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
};

const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Shared button styles ────────────────────────────────────────────────────

function planRow(
  onClick: () => void,
  disabled: boolean,
  loading: boolean,
  label: string,
  sublabel: string,
  cta: string,
  accent?: "purple" | "danger" | "neutral"
) {
  const borderColor =
    accent === "purple"
      ? "rgba(168,85,247,0.3)"
      : accent === "danger"
      ? "rgba(248,113,113,0.3)"
      : "rgba(255,255,255,0.1)";
  const bg =
    accent === "purple"
      ? "rgba(168,85,247,0.08)"
      : accent === "danger"
      ? "rgba(248,113,113,0.06)"
      : "rgba(255,255,255,0.04)";
  const ctaColor =
    accent === "purple"
      ? "#c084fc"
      : accent === "danger"
      ? "#f87171"
      : "rgba(255,255,255,0.5)";

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: "0.85rem",
        border: `1px solid ${borderColor}`,
        background: bg,
        padding: "0.85rem 1rem",
        marginBottom: "0.5rem",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.55 : 1,
        textAlign: "left",
      }}
    >
      <div>
        <p style={{ fontWeight: 900, color: "white", marginBottom: "0.15rem" }}>{label}</p>
        <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{sublabel}</p>
      </div>
      <span
        style={{
          fontSize: "0.72rem",
          fontWeight: 900,
          color: ctaColor,
          flexShrink: 0,
          marginLeft: "1rem",
        }}
      >
        {loading ? "…" : cta}
      </span>
    </button>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function PlanPage() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = async () => {
    try {
      const [subRes, sessRes] = await Promise.all([
        fetch("/api/subscription"),
        fetch("/api/practice-sessions"),
      ]);
      const subData = (await subRes.json()) as SubscriptionInfo;
      const sessData = (await sessRes.json()) as { usage?: UsageInfo };
      setSub(subData);
      if (sessData?.usage) setUsage(sessData.usage);
    } catch {
      setError("Could not load plan information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout>;

    const pollSubscription = async (attempt = 0): Promise<void> => {
      try {
        const subRes = await fetch("/api/subscription");
        const subData = (await subRes.json()) as SubscriptionInfo;
        if (!cancelled) setSub(subData);

        if (!subData.isActive && subData.hasCustomer && attempt < 10) {
          pollTimer = setTimeout(() => void pollSubscription(attempt + 1), 2000);
          return;
        }

        // Subscription confirmed — refresh usage
        const sessRes = await fetch("/api/practice-sessions");
        const sessData = (await sessRes.json()) as { usage?: UsageInfo };
        if (!cancelled && sessData?.usage) setUsage(sessData.usage);
      } catch {
        if (!cancelled) setError("Could not load plan information.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetch("/api/practice-sessions")
      .then((r) => r.json())
      .then((d: { usage?: UsageInfo }) => {
        if (!cancelled && d?.usage) setUsage(d.usage);
      })
      .catch(() => undefined);

    void pollSubscription();

    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
    };
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function openPortal() {
    setPortalLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Could not open billing portal.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  async function startCheckout(planId: string) {
    setCheckoutLoading(planId);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Could not start checkout.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function executeChange(action: string, targetPlanId?: string) {
    setActionLoading(true);
    setError("");
    setConfirm(null);
    try {
      const res = await fetch("/api/subscription/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetPlanId }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        effectiveDate?: string;
      };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Could not update your plan. Please try again.");
        return;
      }

      // Show success message
      if (action === "cancel") {
        const date = data.effectiveDate ? fmtDate(data.effectiveDate) : "your billing date";
        setSuccessMsg(`Your plan will cancel on ${date}. You keep full access until then.`);
      } else if (action === "undo_cancel") {
        setSuccessMsg("Cancellation reversed. Your plan will continue as normal.");
      } else if (action === "upgrade") {
        setSuccessMsg("Plan upgraded! Your new features are active now.");
      } else if (action === "downgrade") {
        const date = data.effectiveDate ? fmtDate(data.effectiveDate) : "your next billing date";
        setSuccessMsg(`Plan will switch at the end of your billing cycle (${date}).`);
      }

      // Reload subscription data
      setTimeout(() => void loadData(), 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  function requestConfirm(state: ConfirmState) {
    setError("");
    setSuccessMsg("");
    setConfirm(state);
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "3.5rem 0" }}>
        <div
          style={{
            height: "1.75rem",
            width: "1.75rem",
            borderRadius: "9999px",
            border: "2px solid rgba(168,85,247,0.5)",
            borderTopColor: "#a855f7",
            animation: "spin 0.7s linear infinite",
          }}
        />
      </div>
    );
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  // Trial = full access with no paid subscription. isPaid = genuine Stripe plan.
  const isTrial = sub?.isTrial ?? false;
  const isPaid = sub?.isPaid ?? false;
  const isPastDue = sub?.isPastDue ?? false;
  const trialDays = Math.max(0, sub?.trialDaysRemaining ?? 0);
  // "Free" here means "no upgrade options taken" — covers both the never-paid
  // Free tier and an active trial (both should see upgrade buttons).
  const isFreeOrTrial = !isPaid;
  const isFree = isFreeOrTrial && !isTrial;
  const isPlus = isPaid && sub?.planName === "Plus";
  const isProfessional = isPaid && sub?.planName === "Professional";
  const isMonthly = sub?.billingInterval === "monthly";
  const isAnnual = sub?.billingInterval === "annual";
  const cancelAtPeriodEnd = sub?.cancelAtPeriodEnd ?? false;
  const isConfirming = !sub?.isActive && Boolean(sub?.hasCustomer);
  const periodEndDate = fmtDate(sub?.currentPeriodEnd ?? null);

  const totalLimit = usage?.dailyLimit ?? 3;
  const totalUsed = usage?.usedToday ?? 0;
  const remaining = usage?.remainingToday ?? Math.max(0, totalLimit - totalUsed);
  const progressPct = Math.min(100, (totalUsed / totalLimit) * 100);
  const limitReached = usage?.limitReached ?? false;

  const busy = actionLoading || portalLoading || checkoutLoading !== null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "inherit" }} className="space-y-5 text-sm">

      {/* ── Current plan card ────────────────────────────────────────────── */}
      <div
        style={{
          borderRadius: "1rem",
          border: isFree
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(168,85,247,0.3)",
          background: isFree
            ? "rgba(255,255,255,0.03)"
            : "rgba(168,85,247,0.07)",
          padding: "1.25rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.65rem",
                fontWeight: 900,
                letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                marginBottom: "0.35rem",
              }}
            >
              Current plan
            </p>
            <p
              style={{
                fontSize: "1.6rem",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "white",
                lineHeight: 1,
              }}
            >
              {sub?.planName ?? "Free"}
              {isAnnual && !isFree && (
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    marginLeft: "0.5rem",
                    verticalAlign: "middle",
                  }}
                >
                  Annual
                </span>
              )}
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
              flexShrink: 0,
              marginTop: "0.25rem",
              background: isConfirming
                ? "rgba(251,191,36,0.15)"
                : isPastDue
                ? "rgba(251,191,36,0.15)"
                : cancelAtPeriodEnd
                ? "rgba(248,113,113,0.15)"
                : isTrial
                ? "linear-gradient(to right, #a855f7, #ec4899)"
                : isFree
                ? "rgba(255,255,255,0.08)"
                : "linear-gradient(to right, #a855f7, #ec4899)",
              color: isConfirming
                ? "#fbbf24"
                : isPastDue
                ? "#fbbf24"
                : cancelAtPeriodEnd
                ? "#f87171"
                : isFree && !isTrial
                ? "rgba(255,255,255,0.6)"
                : "white",
            }}
          >
            {isConfirming
              ? "Activating…"
              : isPastDue
              ? "Payment due"
              : cancelAtPeriodEnd
              ? "Cancelling"
              : isTrial
              ? `Trial · ${trialDays}d left`
              : isFree
              ? "Free"
              : "Active"}
          </span>
        </div>

        {/* Confirming state */}
        {isConfirming && (
          <p style={{ marginTop: "1rem", color: "rgba(251,191,36,0.8)", fontSize: "0.8rem" }}>
            Confirming your subscription with Stripe. This usually takes a few seconds.
          </p>
        )}

        {/* Free — usage bar */}
        {isFree && !isConfirming && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Trial sessions used</span>
              <span style={{ fontWeight: 900, color: "white" }}>
                {totalUsed} / {totalLimit}
              </span>
            </div>
            <div
              style={{
                height: "6px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
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
                ? "All trial sessions used. Upgrade to continue."
                : `${remaining} session${remaining === 1 ? "" : "s"} remaining · keyboard mode only`}
            </p>
          </div>
        )}

        {/* Trial — full access, days remaining */}
        {isTrial && !isConfirming && (
          <div style={{ marginTop: "0.75rem" }}>
            <p style={{ color: "rgba(255,255,255,0.6)" }}>
              Plus trial · voice, camera &amp; unlimited practice
            </p>
            <p style={{ marginTop: "0.35rem", fontSize: "0.8rem", color: trialDays <= 2 ? "#fbbf24" : "rgba(255,255,255,0.45)" }}>
              {trialDays === 0
                ? "Your trial ends today. Upgrade to keep your access."
                : `${trialDays} day${trialDays === 1 ? "" : "s"} left · no payment details on file · upgrade any time to keep access`}
            </p>
          </div>
        )}

        {/* Paid — renewal / cancellation info */}
        {isPaid && !isConfirming && (
          <div style={{ marginTop: "0.75rem" }}>
            {isPastDue ? (
              <p style={{ color: "#fbbf24", fontSize: "0.8rem", fontWeight: 700, lineHeight: 1.5 }}>
                Your last payment didn&rsquo;t go through. Update your card below to
                keep your access. We&rsquo;ll keep retrying in the meantime.
              </p>
            ) : (
              <>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>
                  Unlimited sessions · All interview modes
                </p>
                {periodEndDate && (
                  <p style={{ marginTop: "0.35rem", fontSize: "0.8rem", color: cancelAtPeriodEnd ? "#f87171" : "rgba(255,255,255,0.4)" }}>
                    {cancelAtPeriodEnd
                      ? `Access ends ${periodEndDate}. Your plan will not renew.`
                      : `Renews ${periodEndDate}`}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Success message ───────────────────────────────────────────────── */}
      {successMsg && (
        <div
          style={{
            borderRadius: "0.85rem",
            border: "1px solid rgba(52,211,153,0.25)",
            background: "rgba(52,211,153,0.07)",
            padding: "0.85rem 1rem",
            fontSize: "0.8rem",
            color: "#6ee7b7",
          }}
        >
          {successMsg}
        </div>
      )}

      {/* ── Confirmation step ─────────────────────────────────────────────── */}
      {confirm && (
        <div
          style={{
            borderRadius: "0.85rem",
            border: confirm.danger
              ? "1px solid rgba(248,113,113,0.3)"
              : "1px solid rgba(168,85,247,0.3)",
            background: confirm.danger
              ? "rgba(248,113,113,0.06)"
              : "rgba(168,85,247,0.06)",
            padding: "1rem",
          }}
        >
          <p style={{ fontWeight: 900, color: "white", marginBottom: "0.4rem" }}>
            {confirm.title}
          </p>
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", marginBottom: "1rem", lineHeight: 1.6 }}>
            {confirm.description}
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => void executeChange(confirm.action, confirm.targetPlanId)}
              disabled={actionLoading}
              style={{
                borderRadius: "0.65rem",
                border: "none",
                background: confirm.danger
                  ? "rgba(248,113,113,0.85)"
                  : "linear-gradient(to right, #a855f7, #ec4899)",
                color: "white",
                fontWeight: 900,
                fontSize: "0.78rem",
                padding: "0.5rem 1rem",
                cursor: actionLoading ? "not-allowed" : "pointer",
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              {actionLoading ? "Processing…" : confirm.confirmLabel}
            </button>
            <button
              onClick={() => setConfirm(null)}
              disabled={actionLoading}
              style={{
                borderRadius: "0.65rem",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "transparent",
                color: "rgba(255,255,255,0.55)",
                fontWeight: 700,
                fontSize: "0.78rem",
                padding: "0.5rem 1rem",
                cursor: "pointer",
              }}
            >
              Keep my plan
            </button>
          </div>
        </div>
      )}

      {/* ── Actions — Free plan or active trial (convert to paid) ─────────── */}
      {PAYMENTS_ENABLED && isFreeOrTrial && !confirm && (
        <div>
          <p
            style={{
              fontSize: "0.65rem",
              fontWeight: 900,
              letterSpacing: "0.16em",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            {isTrial ? "Keep your access: choose a plan" : "Upgrade your plan"}
          </p>

          {planRow(
            () => void startCheckout("plus_monthly"),
            busy,
            checkoutLoading === "plus_monthly",
            "Plus · £19 / month",
            "Unlimited sessions · Voice · Camera · Model answers",
            "Upgrade →",
            "purple"
          )}

          {planRow(
            () => void startCheckout("professional_monthly"),
            busy,
            checkoutLoading === "professional_monthly",
            "Professional · £29 / month",
            "Everything in Plus · Assessment Centre · Analytics",
            "Upgrade →",
            "neutral"
          )}

          <p
            style={{
              textAlign: "center",
              fontSize: "0.72rem",
              color: "rgba(255,255,255,0.3)",
              marginTop: "0.5rem",
            }}
          >
            <a href="/for-candidates/pricing" style={{ color: "#c084fc" }}>
              See annual plans and full pricing →
            </a>
          </p>
        </div>
      )}

      {/* ── Actions — Plus Monthly ────────────────────────────────────────── */}
      {PAYMENTS_ENABLED && isPlus && isMonthly && !confirm && (
        <div>
          <p
            style={{
              fontSize: "0.65rem",
              fontWeight: 900,
              letterSpacing: "0.16em",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            Change plan
          </p>

          {!cancelAtPeriodEnd &&
            planRow(
              () =>
                requestConfirm({
                  action: "upgrade",
                  targetPlanId: "professional_monthly",
                  title: "Upgrade to Professional",
                  description:
                    "You'll be charged a prorated amount today for the remainder of your billing cycle, then £29/month from your next renewal. Assessment Centre and advanced analytics unlock immediately.",
                  confirmLabel: "Confirm upgrade",
                }),
              busy,
              false,
              "Upgrade to Professional (£29 / month)",
              "Adds Assessment Centre · Analytics · Custom question mix",
              "Switch →",
              "purple"
            )}

          {cancelAtPeriodEnd
            ? planRow(
                () =>
                  requestConfirm({
                    action: "undo_cancel",
                    title: "Keep your Plus plan",
                    description:
                      "Your plan will continue normally and renew at your next billing date. Nothing will change.",
                    confirmLabel: "Keep my plan",
                  }),
                busy,
                actionLoading,
                "Undo cancellation",
                `Your plan is set to cancel on ${periodEndDate}; click to reverse this`,
                "Undo →",
                "purple"
              )
            : planRow(
                () =>
                  requestConfirm({
                    action: "cancel",
                    title: "Cancel your Plus plan",
                    description: `Your plan will cancel on ${periodEndDate}. You keep full access to all Plus features until then. After that you'll move to the free plan.`,
                    confirmLabel: "Confirm cancellation",
                    danger: true,
                  }),
                busy,
                actionLoading,
                "Cancel plan",
                `Cancels on ${periodEndDate}; you keep access until then`,
                "Cancel →",
                "danger"
              )}
        </div>
      )}

      {/* ── Actions — Professional Monthly ───────────────────────────────── */}
      {PAYMENTS_ENABLED && isProfessional && isMonthly && !confirm && (
        <div>
          <p
            style={{
              fontSize: "0.65rem",
              fontWeight: 900,
              letterSpacing: "0.16em",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            Change plan
          </p>

          {!cancelAtPeriodEnd && (
            <>
              {planRow(
                () =>
                  requestConfirm({
                    action: "downgrade",
                    targetPlanId: "plus_monthly",
                    title: "Switch to Plus",
                    description: `You'll keep Professional until ${periodEndDate}, then automatically switch to Plus (£19/month). Assessment Centre access will end at that point.`,
                    confirmLabel: "Confirm switch to Plus",
                  }),
                busy,
                actionLoading,
                "Switch to Plus (£19 / month)",
                `Takes effect ${periodEndDate}; keeps Professional until then`,
                "Downgrade →",
                "neutral"
              )}
            </>
          )}

          {cancelAtPeriodEnd
            ? planRow(
                () =>
                  requestConfirm({
                    action: "undo_cancel",
                    title: "Keep your Professional plan",
                    description:
                      "Your plan will continue normally and renew at your next billing date.",
                    confirmLabel: "Keep my plan",
                  }),
                busy,
                actionLoading,
                "Undo cancellation",
                `Your plan is set to cancel on ${periodEndDate}; click to reverse this`,
                "Undo →",
                "purple"
              )
            : planRow(
                () =>
                  requestConfirm({
                    action: "cancel",
                    title: "Cancel your Professional plan",
                    description: `Your plan will cancel on ${periodEndDate}. You keep full access to all Professional features until then. After that you'll move to the free plan.`,
                    confirmLabel: "Confirm cancellation",
                    danger: true,
                  }),
                busy,
                actionLoading,
                "Cancel plan",
                `Cancels on ${periodEndDate}; you keep access until then`,
                "Cancel →",
                "danger"
              )}
        </div>
      )}

      {/* ── Actions — Annual plans ────────────────────────────────────────── */}
      {PAYMENTS_ENABLED && isPaid && isAnnual && !confirm && (
        <div>
          <p
            style={{
              fontSize: "0.65rem",
              fontWeight: 900,
              letterSpacing: "0.16em",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            Manage annual plan
          </p>

          {cancelAtPeriodEnd
            ? planRow(
                () =>
                  requestConfirm({
                    action: "undo_cancel",
                    title: "Keep your annual plan",
                    description:
                      "Your plan will continue normally and renew at your annual date.",
                    confirmLabel: "Keep my plan",
                  }),
                busy,
                actionLoading,
                "Undo cancellation",
                `Scheduled to cancel on ${periodEndDate}; click to reverse`,
                "Undo →",
                "purple"
              )
            : planRow(
                () =>
                  requestConfirm({
                    action: "cancel",
                    title: "Cancel at annual renewal",
                    description: `Your plan will not renew on ${periodEndDate}. You keep full access until that date. No refund is available for the remaining annual period.`,
                    confirmLabel: "Confirm cancellation",
                    danger: true,
                  }),
                busy,
                actionLoading,
                "Cancel at renewal",
                `Will not renew on ${periodEndDate}`,
                "Cancel →",
                "danger"
              )}

          {/* Plan changes on annual need portal */}
          {planRow(
            () => void openPortal(),
            busy,
            portalLoading,
            "Change plan or billing",
            "Switch to monthly or a different plan via the billing portal",
            "Open →",
            "neutral"
          )}
        </div>
      )}

      {/* ── Manage billing (Stripe portal) — paid subscriptions only ─────── */}
      {PAYMENTS_ENABLED && isPaid && !isAnnual && !confirm && (
        <button
          onClick={() => void openPortal()}
          disabled={busy}
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: "0.85rem",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.03)",
            padding: "0.75rem 1rem",
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.5 : 1,
            textAlign: "left",
          }}
        >
          <div>
            <p style={{ fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: "0.1rem" }}>
              Manage billing
            </p>
            <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>
              Update payment method · Download invoices
            </p>
          </div>
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", flexShrink: 0, marginLeft: "1rem" }}>
            {portalLoading ? "…" : "Open →"}
          </span>
        </button>
      )}

      {/* ── Payments disabled ─────────────────────────────────────────────── */}
      {!PAYMENTS_ENABLED && isFree && (
        <p
          style={{
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.35)",
            textAlign: "center",
          }}
        >
          Payments are not enabled in this environment.
        </p>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <p style={{ fontSize: "0.72rem", color: "#f87171", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
