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
    // Corporate billing (stored in Prisma Company.planStatus)
    companyPlanStatus?: string | null;
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

    if (Object.keys(metaUpdates).length > 0) {
      const target = await admin.client.users.getUser(id);
      const existing = (target.privateMetadata ?? {}) as Record<string, unknown>;
      await admin.client.users.updateUserMetadata(id, {
        privateMetadata: { ...existing, ...metaUpdates },
      });
    }

    // 3. Update corporate workspace plan status in Prisma (affects all members)
    if (body.companyPlanStatus !== undefined) {
      const member = await prisma.companyMember.findFirst({
        where: { clerkUserId: id },
        select: { companyId: true },
      });
      if (member) {
        await prisma.company.update({
          where: { id: member.companyId },
          data: { planStatus: body.companyPlanStatus ?? "trial" },
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
