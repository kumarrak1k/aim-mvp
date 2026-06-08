import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/app/lib/prisma";
import { requireStripe, getCorporateStripePriceId } from "@/app/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/company/subscription/change
 *
 * In-app subscription changes for corporate (hiring-team) plans.
 * Admin-only.
 *
 * Actions:
 *   cancel      — set cancel_at_period_end: true
 *   undo_cancel — remove cancel_at_period_end
 *   upgrade     — immediate plan swap with proration (monthly only)
 *                 Team → Business
 *   downgrade   — schedule plan swap at end of billing cycle (monthly only)
 *                 Business → Team
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
    // Require admin role
    const member = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId, role: "admin" },
      include: { company: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const company = member.company;
    if (!company.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription found." }, { status: 400 });
    }

    const stripeClient = requireStripe();
    const subscription = await stripeClient.subscriptions.retrieve(
      company.stripeSubscriptionId,
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
      await stripeClient.subscriptions.update(company.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      return NextResponse.json({
        success: true,
        effectiveDate: new Date(periodEnd * 1000).toISOString(),
      });
    }

    // ── Undo cancellation ───────────────────────────────────────────────────
    if (action === "undo_cancel") {
      await stripeClient.subscriptions.update(company.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });
      return NextResponse.json({ success: true });
    }

    // ── Upgrade (immediate, with proration) ────────────────────────────────
    // Only supported for monthly plans. Currently: Team → Business.
    if (action === "upgrade") {
      if (!targetPlanId) {
        return NextResponse.json({ error: "Missing targetPlanId" }, { status: 400 });
      }

      // Release any pending downgrade schedule (e.g. Business→Team at period end)
      // before swapping the item. Stripe refuses direct item updates while a
      // subscription is driven by an active schedule, and a leftover schedule
      // would later revert this upgrade. Releasing detaches the schedule but
      // leaves the live subscription intact.
      const pendingSchedules = await stripeClient.subscriptionSchedules.list({
        customer: subscription.customer as string,
      });
      const activeSchedule = pendingSchedules.data.find(
        (s) =>
          s.subscription === company.stripeSubscriptionId && s.status === "active"
      );
      if (activeSchedule) {
        await stripeClient.subscriptionSchedules.release(activeSchedule.id);
      }

      // targetPlanId is e.g. "business" — derive billing interval from current price
      const currentPrice = firstItem.price as { recurring?: { interval?: string } };
      const billing = currentPrice?.recurring?.interval === "year" ? "annual" : "monthly";
      const newPriceId = getCorporateStripePriceId(
        targetPlanId as "team" | "business",
        billing
      );

      await stripeClient.subscriptions.update(company.stripeSubscriptionId, {
        items: [{ id: itemId, price: newPriceId }],
        proration_behavior: "create_prorations",
      });

      // Update Prisma immediately so UI reflects the change without waiting for webhook
      await prisma.company.update({
        where: { id: company.id },
        data: { planId: targetPlanId },
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

      const currentPrice = firstItem.price as { recurring?: { interval?: string } };
      const billing = currentPrice?.recurring?.interval === "year" ? "annual" : "monthly";
      const newPriceId = getCorporateStripePriceId(
        targetPlanId as "team" | "business",
        billing
      );

      // Check if a schedule already exists for this subscription
      const schedules = await stripeClient.subscriptionSchedules.list({
        customer: subscription.customer as string,
      });
      const existing = schedules.data.find(
        (s) =>
          s.subscription === company.stripeSubscriptionId && s.status === "active"
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
          from_subscription: company.stripeSubscriptionId,
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
    console.error("COMPANY SUBSCRIPTION CHANGE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update subscription. Please try again or contact support." },
      { status: 500 }
    );
  }
}
