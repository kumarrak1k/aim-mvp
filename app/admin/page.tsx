import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { deriveChannel } from "@/app/lib/attributionChannel";
import { prisma, warmDb } from "@/app/lib/prisma";
import { AdminClient, type AdminUser, type AdminOverview } from "./AdminClient";

export const dynamic = "force-dynamic";
// Headroom for warmDb's full retry window (~28s) plus the query batch, for
// when an admin visit lands on a suspended Neon compute.
export const maxDuration = 60;

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
  // Primary: check JWT session claims (no Clerk API call).
  // Fallback: live getUser() when claims don't carry the role — covers the
  //   case where the Clerk JWT template isn't configured or the session was
  //   issued before the template was set up.
  // If both fail (Clerk API 500), access is denied rather than crashing.
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/admin/sign-in");

  const claimsRole = (
    sessionClaims as { metadata?: { role?: string } } | null
  )?.metadata?.role;

  let isSuperAdmin = claimsRole === "superadmin";

  if (!isSuperAdmin && !claimsRole) {
    // JWT template may not include metadata yet — fall back to live API.
    try {
      const verifyClient = await clerkClient();
      const me = await verifyClient.users.getUser(userId);
      const myMeta = me.privateMetadata as { role?: string };
      isSuperAdmin = myMeta.role === "superadmin";
    } catch {
      // Clerk API down — deny access rather than crash.
      isSuperAdmin = false;
    }
  }

  if (!isSuperAdmin) redirect("/api/admin/reject");

  // ── Fetch all Clerk users ────────────────────────────────────────────────
  // getUserList is the one remaining live Clerk API call on this page.
  // Wrap in try-catch so a Clerk 500 shows a friendly error rather than
  // crashing the page with an unhandled Internal Server Error.
  const client = await clerkClient();
  const getUserListResult = await (async () => {
    try {
      return await client.users.getUserList({
        limit: 500,
        orderBy: "-created_at",
      });
    } catch {
      return null;
    }
  })();

  if (!getUserListResult) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f9fafb",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400, padding: "2rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</p>
          <h2 style={{ marginBottom: "0.5rem", color: "#111827" }}>
            Admin temporarily unavailable
          </h2>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Clerk&apos;s API returned an error. Please refresh in a moment.
          </p>
        </div>
      </main>
    );
  }

  const clerkUsers = getUserListResult.data;

  // ── Fetch Prisma company + member + usage data ──────────────────────────
  // Usage aggregates are grouped per user in single queries (not N+1), so
  // this stays a handful of round-trips regardless of user count.
  const now = Date.now();
  const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

  // Wake a suspended Neon compute before the batch below. Without this the
  // first query after an idle period throws "Can't reach database server"
  // and the whole page 500s (observed in Sentry on .com, 18 Jul). Failure
  // here is non-fatal: the guarded batch renders the friendly panel instead.
  try {
    await warmDb();
  } catch {
    // fall through — the query batch below reports the failure properly
  }

  const dbResult = await Promise.all([
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
        compUntil: true,
        stripeCurrentPeriodEnd: true,
      },
    }),
    prisma.practiceSession.groupBy({
      by: ["clerkUserId"],
      _count: { _all: true },
      _max: { createdAt: true },
    }),
    prisma.assessmentCentreSession.groupBy({
      by: ["clerkUserId"],
      _count: { _all: true },
      _max: { createdAt: true },
    }),
    prisma.careerDocGeneration.groupBy({
      by: ["clerkUserId"],
      _count: { _all: true },
      _max: { createdAt: true },
    }),
    prisma.userProfile.findMany({
      select: {
        clerkUserId: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        promoCode: true,
        referrer: true,
        landingPath: true,
      },
    }),
    prisma.practiceSession.count({ where: { createdAt: { gte: d7 } } }),
    prisma.practiceSession.count({ where: { createdAt: { gte: d30 } } }),
    prisma.assessmentCentreSession.count({ where: { createdAt: { gte: d7 } } }),
    prisma.assessmentCentreSession.count({ where: { createdAt: { gte: d30 } } }),
    prisma.careerDocGeneration.count({ where: { createdAt: { gte: d7 } } }),
    prisma.careerDocGeneration.count({ where: { createdAt: { gte: d30 } } }),
  ]).catch((err) => {
    console.error("ADMIN DB ERROR:", err);
    return null;
  });

  if (!dbResult) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f9fafb",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400, padding: "2rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</p>
          <h2 style={{ marginBottom: "0.5rem", color: "#111827" }}>
            Admin temporarily unavailable
          </h2>
          <p style={{ color: "#6b7280", margin: 0 }}>
            The database did not respond in time (it may have been idle).
            Please refresh in a moment.
          </p>
        </div>
      </main>
    );
  }

  const [
    allMembers,
    allCompanies,
    practiceByUser,
    acByUser,
    docsByUser,
    profiles,
    sessions7d,
    sessions30d,
    ac7d,
    ac30d,
    docs7d,
    docs30d,
  ] = dbResult;

  type UsageAgg = { count: number; last: string | null };
  const toUsageMap = (
    rows: Array<{ clerkUserId: string; _count: { _all: number }; _max: { createdAt: Date | null } }>
  ) =>
    new Map<string, UsageAgg>(
      rows.map((r) => [
        r.clerkUserId,
        { count: r._count._all, last: r._max.createdAt?.toISOString() ?? null },
      ])
    );
  const practiceMap = toUsageMap(practiceByUser);
  const acMap = toUsageMap(acByUser);
  const docsMap = toUsageMap(docsByUser);
  const profileSet = new Set(profiles.map((p) => p.clerkUserId));
  const profileMap = new Map(profiles.map((p) => [p.clerkUserId, p]));

  // Build a map: clerkUserId → { company, role }
  const companyById = new Map(allCompanies.map((c) => [c.id, c]));
  const memberMap = new Map(
    allMembers.map((m) => [
      m.clerkUserId,
      { role: m.role, company: companyById.get(m.companyId) },
    ])
  );

  // ── Merge into AdminUser shape ───────────────────────────────────────────
  // Exclude superadmin accounts — they are not candidates or corporate users.
  const nonAdminClerkUsers = clerkUsers.filter((u) => {
    const m = (u.privateMetadata ?? {}) as { role?: string };
    return m.role !== "superadmin";
  });

  const adminUsers: AdminUser[] = nonAdminClerkUsers.map((u) => {
    type UserMeta = {
      accountType?: string;
      stripePlanId?: string;
      subscriptionStatus?: string;
      subscriptionCurrentPeriodEnd?: number;
      role?: string;
      compPlan?: string;
      compUntil?: string;
      trialEndsAt?: string;
      trialConsumed?: boolean;
    };
    const meta = (u.privateMetadata ?? {}) as UserMeta;
    const practice = practiceMap.get(u.id);
    const ac = acMap.get(u.id);
    const docs = docsMap.get(u.id);
    const profile = profileMap.get(u.id);

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
      compPlan: meta.compPlan ?? null,
      compUntil: meta.compUntil ?? null,
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
      companyCompUntil: company?.compUntil
        ? company.compUntil.toISOString()
        : null,
      // Trial state (drives the overview counts; not shown as a column)
      trialEndsAt: meta.trialEndsAt ?? null,
      trialConsumed: meta.trialConsumed === true,
      // Usage (Prisma aggregates)
      practiceCount: practice?.count ?? 0,
      lastPracticeAt: practice?.last ?? null,
      acCount: ac?.count ?? 0,
      lastAcAt: ac?.last ?? null,
      docsCount: docs?.count ?? 0,
      lastDocAt: docs?.last ?? null,
      profileComplete: profileSet.has(u.id),
      // First-touch acquisition attribution (UserProfile)
      utmSource: profile?.utmSource ?? null,
      utmMedium: profile?.utmMedium ?? null,
      utmCampaign: profile?.utmCampaign ?? null,
      promoCode: profile?.promoCode ?? null,
      referrer: profile?.referrer ?? null,
      landingPath: profile?.landingPath ?? null,
      // Timestamps
      createdAt: new Date(u.createdAt).toISOString(),
      lastSignInAt: u.lastSignInAt
        ? new Date(u.lastSignInAt).toISOString()
        : null,
      lastActiveAt: u.lastActiveAt
        ? new Date(u.lastActiveAt).toISOString()
        : null,
    };
  });

  // ── Platform overview ────────────────────────────────────────────────────
  const candidates = adminUsers.filter((x) => x.accountType === "candidate");
  const activeWithin = (days: number) => {
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return adminUsers.filter((x) => {
      const seen = x.lastActiveAt ?? x.lastSignInAt;
      return seen !== null && new Date(seen).getTime() >= cutoff;
    }).length;
  };
  const newWithin = (days: number) => {
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return adminUsers.filter((x) => new Date(x.createdAt).getTime() >= cutoff).length;
  };
  const isPayingCandidate = (x: AdminUser) =>
    x.candidateStatus === "active" ||
    x.candidateStatus === "trialing" ||
    x.candidateStatus === "past_due";
  const payingCandidates = candidates.filter(isPayingCandidate);
  const compActive = candidates.filter(
    (x) => x.compPlan && x.compUntil && new Date(x.compUntil).getTime() > now
  ).length;
  const trialsActive = candidates.filter(
    (x) =>
      !isPayingCandidate(x) &&
      x.trialEndsAt !== null &&
      new Date(x.trialEndsAt).getTime() > now
  ).length;
  const totalOf = (m: Map<string, { count: number }>) =>
    [...m.values()].reduce((s, v) => s + v.count, 0);

  // Acquisition channels — one row per channel with all-time and 30-day
  // signup counts, so ad/community spend can be judged from the dashboard.
  const acquisitionCounts = new Map<string, { total: number; last30d: number }>();
  for (const u of adminUsers) {
    const channel = deriveChannel(u);
    const row = acquisitionCounts.get(channel) ?? { total: 0, last30d: 0 };
    row.total += 1;
    if (new Date(u.createdAt).getTime() >= d30.getTime()) row.last30d += 1;
    acquisitionCounts.set(channel, row);
  }
  const acquisition = [...acquisitionCounts.entries()]
    .map(([channel, c]) => ({ channel, total: c.total, last30d: c.last30d }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const overview: AdminOverview = {
    acquisition,
    newUsers7d: newWithin(7),
    newUsers30d: newWithin(30),
    activeUsers7d: activeWithin(7),
    activeUsers30d: activeWithin(30),
    trialsActive,
    compActive,
    payingPlus: payingCandidates.filter((x) => (x.candidatePlanId ?? "").includes("plus")).length,
    payingProfessional: payingCandidates.filter((x) => (x.candidatePlanId ?? "").includes("professional")).length,
    sessionsTotal: totalOf(practiceMap),
    sessions7d,
    sessions30d,
    acTotal: totalOf(acMap),
    ac7d,
    ac30d,
    docsTotal: totalOf(docsMap),
    docs7d,
    docs30d,
    funnel: {
      signedUp: candidates.length,
      profileDone: candidates.filter((x) => x.profileComplete).length,
      practised: candidates.filter((x) => x.practiceCount > 0).length,
      paying: payingCandidates.length,
    },
  };

  // Derive adminEmail from the getUserList result — avoids a separate getUser() call.
  const meFromList = clerkUsers.find((u) => u.id === userId);
  const adminEmail =
    meFromList?.emailAddresses.find(
      (e) => e.id === meFromList.primaryEmailAddressId
    )?.emailAddress ??
    meFromList?.emailAddresses[0]?.emailAddress ??
    "";

  return <AdminClient users={adminUsers} adminEmail={adminEmail} overview={overview} />;
}
