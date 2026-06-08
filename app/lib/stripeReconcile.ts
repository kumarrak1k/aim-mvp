import { clerkClient } from "@clerk/nextjs/server";
import type Stripe from "stripe";
import { requireStripe } from "./stripe";
import { prisma } from "./prisma";
import {
  isCorporateSubscription,
  candidateUpsertMeta,
  candidateDeletedMeta,
  corporateUpsertData,
  corporateDeletedData,
  type CandidateSubscriptionMeta,
} from "./stripeSync";

/**
 * Nightly Stripe ↔ our-stores reconciler.
 *
 * Webhooks are the primary sync path, but Stripe delivery can fail (endpoint
 * down, signature mismatch, a deploy window). This job is the safety net: it
 * walks every Stripe subscription and, treating Stripe as the source of truth,
 * repairs any candidate (Clerk privateMetadata) or corporate (Prisma Company)
 * record that has drifted. It reuses the SAME mapping helpers as the webhooks
 * (app/lib/stripeSync.ts), so it can never apply a different rule than the
 * real-time handler.
 *
 * Safety properties:
 *  - Read-mostly: an in-sync record costs one comparison and zero writes.
 *  - A `canceled` subscription only downgrades the record that currently points
 *    at it — a stale, long-cancelled sub can never clobber a newer active one.
 *  - Per-subscription try/catch: one bad record can't abort the run.
 *  - Page cap is logged, never silent.
 */

export type ReconcileFix = {
  kind: "candidate" | "corporate";
  id: string; // clerkUserId or companyId
  subscription: string;
  from: string;
  to: string;
};

export type ReconcileSummary = {
  scanned: number;
  candidateChecked: number;
  candidateFixed: number;
  corporateChecked: number;
  corporateFixed: number;
  skipped: number;
  errors: number;
  capped: boolean;
  /** Up to FIX_SAMPLE_LIMIT example corrections; the *Fixed counts are exact. */
  fixes: ReconcileFix[];
};

const PAGE_SIZE = 100; // Stripe's max page size for list endpoints
const MAX_PAGES = 20; // safety bound → up to 2,000 subscriptions scanned per run
const FIX_SAMPLE_LIMIT = 50; // cap the detail array; counts stay exact

function normalizeEmpty(v: unknown): unknown {
  return v === undefined || v === null ? null : v;
}

/** True if any field the webhook manages differs from what Stripe says it should be. */
function candidateMetaDiffers(
  existing: Record<string, unknown>,
  target: CandidateSubscriptionMeta,
): boolean {
  return (Object.keys(target) as (keyof CandidateSubscriptionMeta)[]).some(
    (k) => normalizeEmpty(target[k]) !== normalizeEmpty(existing[k as string]),
  );
}

function sameDate(a: Date | null, b: Date | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.getTime() === b.getTime();
}

function recordFix(summary: ReconcileSummary, fix: ReconcileFix) {
  if (summary.fixes.length < FIX_SAMPLE_LIMIT) summary.fixes.push(fix);
}

async function reconcileCandidate(
  subscription: Stripe.Subscription,
  clerk: Awaited<ReturnType<typeof clerkClient>>,
  summary: ReconcileSummary,
) {
  const clerkUserId = subscription.metadata?.clerkUserId;
  if (!clerkUserId) {
    summary.skipped++;
    return;
  }
  summary.candidateChecked++;

  let user;
  try {
    user = await clerk.users.getUser(clerkUserId);
  } catch {
    // User no longer exists (deleted) or the id is stale — nothing to repair.
    summary.skipped++;
    return;
  }
  const existing = (user.privateMetadata ?? {}) as Record<string, unknown>;

  // An active/trialing subscription may CLAIM the record — this is what catches
  // a brand-new subscriber whose `created` webhook never arrived. Any non-live
  // status (canceled, past_due, incomplete, incomplete_expired, unpaid, paused)
  // may only change the record that ALREADY points at this subscription, so a
  // stale sub can never clobber a newer/active one regardless of scan order.
  const live =
    subscription.status === "active" || subscription.status === "trialing";
  let target: CandidateSubscriptionMeta;
  if (live) {
    target = candidateUpsertMeta(subscription);
  } else {
    if (existing.stripeSubscriptionId !== subscription.id) {
      summary.skipped++;
      return;
    }
    target =
      subscription.status === "canceled"
        ? candidateDeletedMeta(subscription)
        : candidateUpsertMeta(subscription);
  }

  if (!candidateMetaDiffers(existing, target)) return; // already in sync

  await clerk.users.updateUserMetadata(clerkUserId, {
    privateMetadata: { ...existing, ...target },
  });
  summary.candidateFixed++;
  recordFix(summary, {
    kind: "candidate",
    id: clerkUserId,
    subscription: subscription.id,
    from: String(existing.subscriptionStatus ?? "—"),
    to: String(target.subscriptionStatus ?? "—"),
  });
}

async function reconcileCorporate(
  subscription: Stripe.Subscription,
  summary: ReconcileSummary,
) {
  const companyId = subscription.metadata?.companyId;
  if (!companyId) {
    summary.skipped++;
    return;
  }
  summary.corporateChecked++;

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    summary.skipped++;
    return;
  }

  // Same rule as candidates: a live sub may claim the company; a non-live sub
  // may only update the company that already points at it.
  const live =
    subscription.status === "active" || subscription.status === "trialing";
  let target:
    | ReturnType<typeof corporateUpsertData>
    | ReturnType<typeof corporateDeletedData>;
  if (live) {
    target = corporateUpsertData(subscription);
  } else {
    if (company.stripeSubscriptionId !== subscription.id) {
      summary.skipped++;
      return;
    }
    target =
      subscription.status === "canceled"
        ? corporateDeletedData(subscription)
        : corporateUpsertData(subscription);
  }

  const customerDrift =
    "stripeCustomerId" in target &&
    company.stripeCustomerId !== target.stripeCustomerId;
  const planIdDrift =
    "planId" in target &&
    target.planId !== undefined &&
    company.planId !== target.planId;
  const drift =
    company.planStatus !== target.planStatus ||
    planIdDrift ||
    company.stripeSubscriptionId !== target.stripeSubscriptionId ||
    !sameDate(company.stripeCurrentPeriodEnd, target.stripeCurrentPeriodEnd) ||
    customerDrift;

  if (!drift) return; // already in sync

  await prisma.company.update({ where: { id: companyId }, data: target });
  summary.corporateFixed++;
  recordFix(summary, {
    kind: "corporate",
    id: companyId,
    subscription: subscription.id,
    from: company.planStatus,
    to: target.planStatus,
  });
}

export async function runStripeReconcile(): Promise<ReconcileSummary> {
  const stripe = requireStripe();
  const clerk = await clerkClient();
  const summary: ReconcileSummary = {
    scanned: 0,
    candidateChecked: 0,
    candidateFixed: 0,
    corporateChecked: 0,
    corporateFixed: 0,
    skipped: 0,
    errors: 0,
    capped: false,
    fixes: [],
  };

  let startingAfter: string | undefined;
  let pages = 0;

  while (true) {
    const page = await stripe.subscriptions.list({
      status: "all",
      limit: PAGE_SIZE,
      starting_after: startingAfter,
    });

    for (const sub of page.data) {
      summary.scanned++;
      try {
        if (isCorporateSubscription(sub)) {
          await reconcileCorporate(sub, summary);
        } else {
          await reconcileCandidate(sub, clerk, summary);
        }
      } catch (err) {
        summary.errors++;
        console.error("RECONCILE: subscription failed", sub.id, err);
      }
    }

    if (!page.has_more) break;
    pages++;
    if (pages >= MAX_PAGES) {
      summary.capped = true;
      console.warn(
        `RECONCILE: hit ${MAX_PAGES}-page cap (${summary.scanned} subs scanned); remaining subscriptions deferred to next run`,
      );
      break;
    }
    startingAfter = page.data[page.data.length - 1]?.id;
  }

  return summary;
}
