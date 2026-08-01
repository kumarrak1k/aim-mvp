import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { buildUserActivityReport } from "@/app/lib/userActivityReport";
import { resolveCandidatePlan, type CandidateBillingMeta } from "@/app/lib/candidatePlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Full behavioural report for one user, for the admin drill-down.
 *
 * Superadmin only, and verified against the authoritative Clerk profile rather
 * than JWT claims: this returns another person's browsing history, chat
 * questions and interview answers, so the gate must not depend on a token
 * template being configured correctly.
 */
async function requireSuperadmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const client = await clerkClient();
  const me = await client.users.getUser(userId);
  const meta = me.privateMetadata as { role?: string };
  if (meta.role !== "superadmin") return null;
  return { client };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperadmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing user id." }, { status: 400 });
  }

  const report = await buildUserActivityReport(id);

  // Identity and plan come from Clerk, not the local DB — the report is about
  // behaviour, and the admin needs to see who it belongs to alongside it.
  let identity: {
    email: string | null;
    name: string | null;
    createdAt: string | null;
    lastSignInAt: string | null;
    plan: ReturnType<typeof resolveCandidatePlan> | null;
  } = { email: null, name: null, createdAt: null, lastSignInAt: null, plan: null };

  try {
    const user = await admin.client.users.getUser(id);
    identity = {
      email: user.primaryEmailAddress?.emailAddress ?? null,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
      lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null,
      plan: resolveCandidatePlan(user.privateMetadata as CandidateBillingMeta),
    };
  } catch {
    // Deleted Clerk user with residual rows — still show the activity we hold.
  }

  return NextResponse.json({ identity, ...report });
}
