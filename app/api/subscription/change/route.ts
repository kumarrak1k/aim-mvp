import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireStripe, getStripePriceId, type StripePlanId } from "@/app/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Release any active subscription schedule for this subscription. A pending
 * downgrade leaves a schedule whose phase-2 price would otherwise overwrite a
 * later upgrade at the cycle boundary — so we release it before mutating.
 */
async function releaseActiveSchedule(
  stripeClient: Stripe,
  customerId: string,
  subscriptionId: string
) {
  try {
    const schedules = await stripeClient.subscriptionSchedules.list({ customer: customerId });
    const active = schedules.data.find(
      (s) => s.subscription === subscriptionId && s.status === "active"
    );
    if (active) await stripeClient.subscriptionSchedules.release(active.id);
  } catch (err) {
    console.error("RELEASE SCHEDULE ERROR:", err);
  }
}

/**
 * POST /api/subscription/change
 *
 * Handles in-app subscription changes for candidate plans.
 *
 * Actions:
 *   cancel          — set cancel_at_period_end: true (works for monthly and annual)
 *   undo_cancel     — remove cancel_at_period_end
 *   upgrade         — immediate plan swap with proration (monthly only)
 *   downgrade       — schedule plan swap at end of current billing cycle (monthly only)
 *
 * Annual plans: only cancel / undo_cancel are supported in-app.
 * All other annual changes must go through the Stripe customer portal.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as {
    action?: string;
    targetPlanId?: string;
  };
  const { action, targetPlanId } = body;

  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  try {
    const stripeClient = requireStripe();
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const meta = user.privateMetadata as {
      stripeSubscriptionId?: string;
      stripePlanId?: string;
      stripeCustomerId?: string;
    };

    if (!meta.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription found." }, { status: 400 });
    }

    const subscription = await stripeClient.subscriptions.retrieve(
      meta.stripeSubscriptionId,
      { expand: ["items.data.price"] }
    );

    const firstItem = subscription.items.data[0];
    const itemId = firstItem.id;
    const currentPriceId = (firstItem.price as { id: string }).id;
    // In Stripe API 2026-04-22+, period timestamps live on the subscription item
    const periodEnd: number = (firstItem as unknown as { current_period_end: number }).current_period_end;
    const periodStart: number = (firstItem as unknown as { current_period_start: number }).current_period_start;

    // ── Cancel at period end ────────────────────────────────────────────────
    if (action === "cancel") {
      await stripeClient.subscriptions.update(meta.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      return NextResponse.json({
        success: true,
        effectiveDate: new Date(periodEnd * 1000).toISOString(),
      });
    }

    // ── Undo cancellation ───────────────────────────────────────────────────
    if (action === "undo_cancel") {
      await releaseActiveSchedule(stripeClient, subscription.customer as string, meta.stripeSubscriptionId);
      await stripeClient.subscriptions.update(meta.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });
      return NextResponse.json({ success: true });
    }

    // ── Upgrade (immediate, with proration) ────────────────────────────────
    // Only supported for monthly plans.
    if (action === "upgrade") {
      if (!targetPlanId) {
        return NextResponse.json({ error: "Missing targetPlanId" }, { status: 400 });
      }
      const newPriceId = getStripePriceId(targetPlanId as StripePlanId);

      // Release any pending downgrade schedule first, otherwise its phase-2
      // price would silently revert this upgrade at the next cycle boundary.
      await releaseActiveSchedule(stripeClient, subscription.customer as string, meta.stripeSubscriptionId);

      await stripeClient.subscriptions.update(meta.stripeSubscriptionId, {
        items: [{ id: itemId, price: newPriceId }],
        proration_behavior: "create_prorations",
        // Keep subscription.metadata.planId current so the reconciling webhook
        // (which reads it) doesn't overwrite stripePlanId back to the old plan.
        metadata: { ...subscription.metadata, clerkUserId: userId, planId: targetPlanId },
      });

      // Update Clerk metadata immediately so the UI reflects the change
      // without waiting for the webhook.
      await clerk.users.updateUserMetadata(userId, {
        privateMetadata: {
          stripePlanId: targetPlanId,
          subscriptionStatus: "active",
        },
      });

      return NextResponse.json({ success: true });
    }

    // ── Downgrade (deferred to end of billing cycle) ────────────────────────
    // Creates a Stripe subscription schedule so the plan changes automatically
    // at the next billing cycle boundary.
    if (action === "downgrade") {
      if (!targetPlanId) {
        return NextResponse.json({ error: "Missing targetPlanId" }, { status: 400 });
      }
      const newPriceId = getStripePriceId(targetPlanId as StripePlanId);

      // Check if a schedule already exists for this subscription
      const schedules = await stripeClient.subscriptionSchedules.list({
        customer: subscription.customer as string,
      });
      const existing = schedules.data.find(
        (s) =>
          s.subscription === meta.stripeSubscriptionId && s.status === "active"
      );

      const phases: Stripe.SubscriptionScheduleUpdateParams.Phase[] = [
        {
          start_date: periodStart,
          end_date: periodEnd,
          items: [{ price: currentPriceId }],
          proration_behavior: "none",
        },
        {
          items: [{ price: newPriceId }],
          proration_behavior: "none",
        },
      ];

      if (existing) {
        await stripeClient.subscriptionSchedules.update(existing.id, {
          end_behavior: "release",
          phases,
        });
      } else {
        const schedule = await stripeClient.subscriptionSchedules.create({
          from_subscription: meta.stripeSubscriptionId,
        });
        await stripeClient.subscriptionSchedules.update(schedule.id, {
          end_behavior: "release",
          phases,
        });
      }

      return NextResponse.json({
        success: true,
        effectiveDate: new Date(periodEnd * 1000).toISOString(),
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("SUBSCRIPTION CHANGE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update subscription. Please try again or contact support." },
      { status: 500 }
    );
  }
}
