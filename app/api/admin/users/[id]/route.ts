import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Verify the caller is a signed-in superadmin. Returns null if not. */
async function requireSuperadmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const client = await clerkClient();
  const me = await client.users.getUser(userId);
  const meta = me.privateMetadata as { role?: string };
  if (meta.role !== "superadmin") return null;
  return { callerId: userId, client };
}

/**
 * PATCH /api/admin/users/[id]
 * Update a user's firstName, lastName, and/or accountType.
 * Body: { firstName?, lastName?, accountType? }
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const admin = await requireSuperadmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as {
    firstName?: string | null;
    lastName?: string | null;
    accountType?: string;
    // Candidate billing (stored in Clerk privateMetadata)
    subscriptionStatus?: string | null;
    stripePlanId?: string | null;
    candidatePeriodEnd?: string | null; // ISO date → unix seconds in metadata
    // Complimentary access (admin-granted guest access; no card, no Stripe)
    compPlan?: string | null;           // "plus" | "professional" | null to revoke
    compUntil?: string | null;          // ISO date → access ends automatically
    // Corporate billing (stored in Prisma Company)
    companyPlanStatus?: string | null;
    companyPlanId?: string | null;
    companyName?: string | null;        // updates Company.name
    companyPeriodEnd?: string | null;   // ISO date → Company.stripeCurrentPeriodEnd
  };

  try {
    // 1. Update name fields in Clerk (only if provided)
    if (body.firstName !== undefined || body.lastName !== undefined) {
      await admin.client.users.updateUser(id, {
        firstName: body.firstName ?? undefined,
        lastName: body.lastName ?? undefined,
      });
    }

    // 2. Update Clerk privateMetadata fields (merge — preserve all other keys)
    const metaUpdates: Record<string, unknown> = {};
    if (body.accountType !== undefined) metaUpdates.accountType = body.accountType;
    if (body.subscriptionStatus !== undefined) metaUpdates.subscriptionStatus = body.subscriptionStatus;
    if (body.stripePlanId !== undefined) metaUpdates.stripePlanId = body.stripePlanId;
    if (body.candidatePeriodEnd !== undefined) {
      metaUpdates.subscriptionCurrentPeriodEnd = body.candidatePeriodEnd
        ? Math.floor(new Date(body.candidatePeriodEnd).getTime() / 1000)
        : null;
    }
    if (body.compPlan !== undefined) {
      const plan = (body.compPlan ?? "").toLowerCase();
      metaUpdates.compPlan =
        plan === "plus" || plan === "professional" ? plan : null;
    }
    if (body.compUntil !== undefined) {
      metaUpdates.compUntil = body.compUntil
        ? new Date(body.compUntil).toISOString()
        : null;
    }

    if (Object.keys(metaUpdates).length > 0) {
      const target = await admin.client.users.getUser(id);
      const existing = (target.privateMetadata ?? {}) as Record<string, unknown>;
      await admin.client.users.updateUserMetadata(id, {
        privateMetadata: { ...existing, ...metaUpdates },
      });
    }

    // 3. Update corporate workspace in Prisma (affects all members)
    const hasCorporateUpdate =
      body.companyPlanStatus !== undefined ||
      body.companyPlanId !== undefined ||
      body.companyName !== undefined ||
      body.companyPeriodEnd !== undefined;

    if (hasCorporateUpdate) {
      const member = await prisma.companyMember.findFirst({
        where: { clerkUserId: id },
        select: { companyId: true },
      });
      if (member) {
        const companyData: Record<string, unknown> = {};
        if (body.companyPlanStatus !== undefined) companyData.planStatus = body.companyPlanStatus ?? "trial";
        if (body.companyPlanId !== undefined && body.companyPlanId !== null) companyData.planId = body.companyPlanId;
        if (body.companyName !== undefined) companyData.name = body.companyName ?? "";
        if (body.companyPeriodEnd !== undefined) {
          companyData.stripeCurrentPeriodEnd = body.companyPeriodEnd
            ? new Date(body.companyPeriodEnd)
            : null;
        }
        await prisma.company.update({
          where: { id: member.companyId },
          data: companyData,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN PATCH USER ERROR:", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Permanently deletes the Clerk account and removes Prisma membership records.
 * The caller cannot delete their own account.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const admin = await requireSuperadmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 403 });
  }

  const { id } = await params;

  if (id === admin.callerId) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  try {
    // Remove from any company workspace first
    await prisma.companyMember.deleteMany({ where: { clerkUserId: id } });

    // Remove any pending invite records for this user
    // (invites are keyed by email — we look up the email first)
    try {
      const target = await admin.client.users.getUser(id);
      const email = target.emailAddresses[0]?.emailAddress;
      if (email) {
        await prisma.companyInvite.deleteMany({ where: { email } });
      }
    } catch {
      // Non-fatal — user may already be gone from Clerk
    }

    // Delete the Clerk account (permanent)
    await admin.client.users.deleteUser(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN DELETE USER ERROR:", error);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
