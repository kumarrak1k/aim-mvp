import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { AdminClient, type AdminUser } from "./AdminClient";

export const dynamic = "force-dynamic";

// No metadata — this page must not appear in any sitemap or <title> that leaks.
export const metadata = { robots: "noindex, nofollow" };

/**
 * /admin — superadmin-only internal user management page.
 *
 * Access control: the signed-in Clerk user must have
 *   privateMetadata.role === "superadmin"
 * set directly in the Clerk dashboard. No nav link exists anywhere on
 * the site. Security comes from Clerk auth, not URL obscurity.
 *
 * Data sources:
 *   - Clerk API  → all registered users, names, emails, plan metadata
 *   - Prisma     → Company records for corporate users
 */
export default async function AdminPage() {
  // ── Auth gate ────────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const client = await clerkClient();
  const me = await client.users.getUser(userId);
  const myMeta = me.privateMetadata as { role?: string };
  if (myMeta.role !== "superadmin") redirect("/");

  // ── Fetch all Clerk users ────────────────────────────────────────────────
  // Single call up to 500 users — fine for MVP. Add pagination loop when needed.
  const { data: clerkUsers } = await client.users.getUserList({
    limit: 500,
    orderBy: "-created_at",
  });

  // ── Fetch Prisma company + member data ───────────────────────────────────
  const [allMembers, allCompanies] = await Promise.all([
    prisma.companyMember.findMany({
      select: { clerkUserId: true, companyId: true, role: true },
    }),
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        planId: true,
        planStatus: true,
        trialEndsAt: true,
        stripeCurrentPeriodEnd: true,
      },
    }),
  ]);

  // Build a map: clerkUserId → { company, role }
  const companyById = new Map(allCompanies.map((c) => [c.id, c]));
  const memberMap = new Map(
    allMembers.map((m) => [
      m.clerkUserId,
      { role: m.role, company: companyById.get(m.companyId) },
    ])
  );

  // ── Merge into AdminUser shape ───────────────────────────────────────────
  const adminUsers: AdminUser[] = clerkUsers.map((u) => {
    type UserMeta = {
      accountType?: string;
      stripePlanId?: string;
      subscriptionStatus?: string;
      subscriptionCurrentPeriodEnd?: number;
      role?: string;
    };
    const meta = (u.privateMetadata ?? {}) as UserMeta;

    const primaryEmail =
      u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)
        ?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? "";

    const membership = memberMap.get(u.id);
    const company = membership?.company;

    return {
      id: u.id,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      email: primaryEmail,
      accountType: meta.accountType ?? "unknown",
      // Candidate Stripe billing
      candidatePlanId: meta.stripePlanId ?? null,
      candidateStatus: meta.subscriptionStatus ?? null,
      candidatePeriodEnd:
        typeof meta.subscriptionCurrentPeriodEnd === "number"
          ? new Date(meta.subscriptionCurrentPeriodEnd * 1000).toISOString()
          : null,
      // Corporate workspace
      companyName: company?.name ?? null,
      companyRole: membership?.role ?? null,
      companyPlanId: company?.planId ?? null,
      companyPlanStatus: company?.planStatus ?? null,
      companyPeriodEnd: company?.stripeCurrentPeriodEnd
        ? company.stripeCurrentPeriodEnd.toISOString()
        : null,
      companyTrialEndsAt: company?.trialEndsAt
        ? company.trialEndsAt.toISOString()
        : null,
      // Timestamps
      createdAt: new Date(u.createdAt).toISOString(),
      lastSignInAt: u.lastSignInAt
        ? new Date(u.lastSignInAt).toISOString()
        : null,
    };
  });

  return <AdminClient users={adminUsers} />;
}
