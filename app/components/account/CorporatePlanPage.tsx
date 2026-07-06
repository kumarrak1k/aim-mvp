"use client";

import { useEffect, useState } from "react";

/**
 * CorporatePlanPage — rendered inside the Clerk UserButton modal as a custom
 * profile page for hiring-team (corporate) users.
 *
 * Shows the company's current plan and provides in-app upgrade / downgrade /
 * cancellation controls for monthly plans. Annual-plan changes (other than
 * cancellation) are directed to the Stripe billing portal.
 *
 * Rules:
 *   Monthly Team      → upgrade to Business: immediate, prorated
 *   Monthly Business  → downgrade to Team:   deferred to end of billing cycle
 *   Any monthly plan  → cancel:              cancel_at_period_end: true
 *   Annual plan       → cancel only;         other changes via portal
 */

type CorpSubInfo = {
  planId: string | null;
  planName: string;
  planStatus: string;
  isActive: boolean;
  isAdmin: boolean;
  billingInterval: "monthly" | "annual" | null;
  cancelAtPeriodEnd: boolean;
  isPastDue?: boolean;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  hasStripeSubscription: boolean;
  hasStripeCustomer: boolean;
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

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function planRow(
  onClick: () => void,
  disabled: boolean,
  loading: boolean,
  label: string,
  sublabel: string,
  cta: string,
  accent?: "fuchsia" | "danger" | "neutral"
) {
  const borderColor =
    accent === "fuchsia"
      ? "rgba(232,72,229,0.3)"
      : accent === "danger"
      ? "rgba(248,113,113,0.3)"
      : "rgba(255,255,255,0.1)";
  const bg =
    accent === "fuchsia"
      ? "rgba(232,72,229,0.07)"
      : accent === "danger"
      ? "rgba(248,113,113,0.06)"
      : "rgba(255,255,255,0.04)";
  const ctaColor =
    accent === "fuchsia"
      ? "#e879f9"
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

export function CorporatePlanPage() {
  const [sub, setSub] = useState<CorpSubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch("/api/company/subscription");
      if (res.ok) {
        setSub((await res.json()) as CorpSubInfo);
      }
    } catch {
      setError("Could not load plan information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    setError("");
    try {
      const res = await fetch("/api/company/billing-portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Could not open billing portal.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  async function startCheckout() {
    setCheckoutLoading(true);
    setError("");
    try {
      const res = await fetch("/api/company/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Could not start checkout.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function executeChange(action: string, targetPlanId?: string) {
    setActionLoading(true);
    setError("");
    setConfirm(null);
    try {
      const res = await fetch("/api/company/subscription/change", {
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

      if (action === "cancel") {
        const date = data.effectiveDate ? fmtDate(data.effectiveDate) : "your billing date";
        setSuccessMsg(`Your plan will cancel on ${date}. Full access continues until then.`);
      } else if (action === "undo_cancel") {
        setSuccessMsg("Cancellation reversed. Your plan will continue as normal.");
      } else if (action === "upgrade") {
        setSuccessMsg("Plan upgraded! Your workspace now has Business-tier access.");
      } else if (action === "downgrade") {
        const date = data.effectiveDate ? fmtDate(data.effectiveDate) : "your next billing date";
        setSuccessMsg(`Plan will switch to Team at the end of your billing cycle (${date}).`);
      }

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

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "3.5rem 0" }}>
        <div
          style={{
            height: "1.75rem",
            width: "1.75rem",
            borderRadius: "9999px",
            border: "2px solid rgba(232,72,229,0.5)",
            borderTopColor: "#e879f9",
            animation: "spin 0.7s linear infinite",
          }}
        />
      </div>
    );
  }

  // Derived state
  const planStatus = sub?.planStatus ?? "none";
  const isPastDue = sub?.isPastDue ?? false;
  const isTrial = planStatus === "trial" && Boolean(sub?.trialDaysRemaining);
  const isNoneOrExpired = ["none", "expired", "cancelled"].includes(planStatus) || (!isTrial && !sub?.isActive);
  const isPaidActive = sub?.isActive && sub?.hasStripeSubscription;
  const isTeam = sub?.planId === "team";
  const isBusiness = sub?.planId === "business";
  const isMonthly = sub?.billingInterval === "monthly";
  const isAnnual = sub?.billingInterval === "annual";
  const cancelAtPeriodEnd = sub?.cancelAtPeriodEnd ?? false;
  const periodEndDate = fmtDate(sub?.currentPeriodEnd ?? null);
  const busy = actionLoading || portalLoading || checkoutLoading;
  const isAdmin = sub?.isAdmin ?? false;

  // Plan display colour
  const accentBorder = isPaidActive
    ? "rgba(232,72,229,0.3)"
    : isTrial
    ? "rgba(251,191,36,0.25)"
    : "rgba(255,255,255,0.1)";
  const accentBg = isPaidActive
    ? "rgba(232,72,229,0.06)"
    : isTrial
    ? "rgba(251,191,36,0.06)"
    : "rgba(255,255,255,0.03)";

  return (
    <div style={{ fontFamily: "inherit" }} className="space-y-5 text-sm">

      {/* ── Current plan card ─────────────────────────────────────────────── */}
      <div
        style={{
          borderRadius: "1rem",
          border: `1px solid ${accentBorder}`,
          background: accentBg,
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
              {sub?.planName ?? "None"}
              {isAnnual && isPaidActive && (
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
              background: isPastDue
                ? "rgba(251,191,36,0.15)"
                : cancelAtPeriodEnd
                ? "rgba(248,113,113,0.15)"
                : isPaidActive
                ? "linear-gradient(to right, #c026d3, #a855f7)"
                : isTrial
                ? "rgba(251,191,36,0.15)"
                : "rgba(255,255,255,0.08)",
              color: isPastDue
                ? "#fbbf24"
                : cancelAtPeriodEnd
                ? "#f87171"
                : isPaidActive
                ? "white"
                : isTrial
                ? "#fbbf24"
                : "rgba(255,255,255,0.5)",
            }}
          >
            {isPastDue
              ? "Payment due"
              : cancelAtPeriodEnd
              ? "Cancelling"
              : isPaidActive
              ? "Active"
              : isTrial
              ? `Trial · ${sub?.trialDaysRemaining ?? 0}d left`
              : "Inactive"}
          </span>
        </div>

        {/* Trial info */}
        {isTrial && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>
              Full Team access during your trial, up to 10 candidate invites.
            </p>
            {sub?.trialEndsAt && (
              <p style={{ marginTop: "0.35rem", fontSize: "0.8rem", color: "rgba(251,191,36,0.7)" }}>
                Trial ends {fmtDate(sub.trialEndsAt)}; add a payment method to avoid interruption.
              </p>
            )}
          </div>
        )}

        {/* Paid info */}
        {isPaidActive && !isTrial && (
          <div style={{ marginTop: "0.75rem" }}>
            {isPastDue && (
              <p style={{ color: "#fbbf24", fontSize: "0.8rem", fontWeight: 700, lineHeight: 1.5, marginBottom: "0.5rem" }}>
                Your last payment didn&rsquo;t go through. Update your card via
                Manage billing below to keep your workspace access. We&rsquo;ll
                keep retrying in the meantime.
              </p>
            )}
            {isTeam && (
              <p style={{ color: "rgba(255,255,255,0.5)" }}>
                3 recruiter seats · 100 candidate invites / month
              </p>
            )}
            {isBusiness && (
              <p style={{ color: "rgba(255,255,255,0.5)" }}>
                10 recruiter seats · 500 candidate invites / month · Custom branding
              </p>
            )}
            {periodEndDate && (
              <p style={{ marginTop: "0.35rem", fontSize: "0.8rem", color: cancelAtPeriodEnd ? "#f87171" : "rgba(255,255,255,0.4)" }}>
                {cancelAtPeriodEnd
                  ? `Access ends ${periodEndDate}. Your plan will not renew.`
                  : `Renews ${periodEndDate}`}
              </p>
            )}
          </div>
        )}

        {/* Inactive */}
        {isNoneOrExpired && !isTrial && (
          <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
            {planStatus === "cancelled"
              ? "Your subscription has been cancelled."
              : planStatus === "expired"
              ? "Your trial or plan has expired."
              : "No active plan. Add a payment method to send invites."}
          </p>
        )}
      </div>

      {/* ── Success message ────────────────────────────────────────────────── */}
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
              : "1px solid rgba(232,72,229,0.3)",
            background: confirm.danger
              ? "rgba(248,113,113,0.06)"
              : "rgba(232,72,229,0.06)",
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
                  : "linear-gradient(to right, #c026d3, #a855f7)",
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

      {/* ── Actions — Trial: convert to paid ─────────────────────────────── */}
      {PAYMENTS_ENABLED && isTrial && isAdmin && !confirm && (
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
            Add payment method
          </p>
          {planRow(
            () => void startCheckout(),
            busy,
            checkoutLoading,
            "Activate subscription",
            "Continue with your current plan, no interruption to your trial",
            "Add payment →",
            "fuchsia"
          )}
        </div>
      )}

      {/* ── Actions — Inactive / expired: restart ─────────────────────────── */}
      {PAYMENTS_ENABLED && isNoneOrExpired && isAdmin && !confirm && (
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
            Reactivate
          </p>
          {planRow(
            () => void startCheckout(),
            busy,
            checkoutLoading,
            "Restart subscription",
            "Choose a plan and add a payment method",
            "Get started →",
            "fuchsia"
          )}
        </div>
      )}

      {/* ── Actions — Team Monthly ─────────────────────────────────────────── */}
      {PAYMENTS_ENABLED && isPaidActive && isTeam && isMonthly && isAdmin && !confirm && (
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
                  targetPlanId: "business",
                  title: "Upgrade to Business",
                  description:
                    "You'll be charged a prorated amount today for the remainder of your billing cycle, then £399/month from your next renewal. 10 seats, 500 invites/month, and custom branding unlock immediately.",
                  confirmLabel: "Confirm upgrade",
                }),
              busy,
              false,
              "Upgrade to Business (£399 / month)",
              "10 seats · 500 invites / month · Custom branding",
              "Switch →",
              "fuchsia"
            )}

          {cancelAtPeriodEnd
            ? planRow(
                () =>
                  requestConfirm({
                    action: "undo_cancel",
                    title: "Keep your Team plan",
                    description: "Your plan will continue normally and renew at your next billing date.",
                    confirmLabel: "Keep my plan",
                  }),
                busy,
                actionLoading,
                "Undo cancellation",
                `Your plan is set to cancel on ${periodEndDate}; click to reverse this`,
                "Undo →",
                "fuchsia"
              )
            : planRow(
                () =>
                  requestConfirm({
                    action: "cancel",
                    title: "Cancel your Team plan",
                    description: `Your plan will cancel on ${periodEndDate}. Your workspace keeps full access until then. After that you'll lose the ability to send invites and create templates.`,
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

      {/* ── Actions — Business Monthly ─────────────────────────────────────── */}
      {PAYMENTS_ENABLED && isPaidActive && isBusiness && isMonthly && isAdmin && !confirm && (
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
            planRow(
              () =>
                requestConfirm({
                  action: "downgrade",
                  targetPlanId: "team",
                  title: "Switch to Team",
                  description: `You'll keep Business until ${periodEndDate}, then automatically switch to Team (£149/month). Custom branding and the extra seats will be removed at that point.`,
                  confirmLabel: "Confirm switch to Team",
                }),
              busy,
              actionLoading,
              "Switch to Team (£149 / month)",
              `Takes effect ${periodEndDate}; keeps Business until then`,
              "Downgrade →",
              "neutral"
            )
          )}

          {cancelAtPeriodEnd
            ? planRow(
                () =>
                  requestConfirm({
                    action: "undo_cancel",
                    title: "Keep your Business plan",
                    description: "Your plan will continue normally and renew at your next billing date.",
                    confirmLabel: "Keep my plan",
                  }),
                busy,
                actionLoading,
                "Undo cancellation",
                `Your plan is set to cancel on ${periodEndDate}; click to reverse this`,
                "Undo →",
                "fuchsia"
              )
            : planRow(
                () =>
                  requestConfirm({
                    action: "cancel",
                    title: "Cancel your Business plan",
                    description: `Your plan will cancel on ${periodEndDate}. Your workspace keeps full access until then.`,
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

      {/* ── Actions — Annual plans ─────────────────────────────────────────── */}
      {PAYMENTS_ENABLED && isPaidActive && isAnnual && isAdmin && !confirm && (
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
                    description: "Your plan will continue normally and renew at your annual date.",
                    confirmLabel: "Keep my plan",
                  }),
                busy,
                actionLoading,
                "Undo cancellation",
                `Scheduled to cancel on ${periodEndDate}; click to reverse`,
                "Undo →",
                "fuchsia"
              )
            : planRow(
                () =>
                  requestConfirm({
                    action: "cancel",
                    title: "Cancel at annual renewal",
                    description: `Your plan will not renew on ${periodEndDate}. Your workspace keeps full access until that date.`,
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

          {planRow(
            () => void openPortal(),
            busy,
            portalLoading,
            "Change plan or billing",
            "Switch between Team and Business, or move to monthly via the billing portal",
            "Open →",
            "neutral"
          )}
        </div>
      )}

      {/* ── Manage billing — always available for paid users ──────────────── */}
      {PAYMENTS_ENABLED && isPaidActive && !isAnnual && isAdmin && !confirm && (
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

      {/* ── Non-admin notice ───────────────────────────────────────────────── */}
      {!isAdmin && isPaidActive && !confirm && (
        <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
          Only workspace admins can change the plan. Contact your admin to make changes.
        </p>
      )}

      {/* ── Payments disabled ─────────────────────────────────────────────── */}
      {!PAYMENTS_ENABLED && (
        <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
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
