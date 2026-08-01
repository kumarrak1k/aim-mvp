import { prisma } from "./prisma";
import { ACTIVITY_EVENTS } from "./activity";

/**
 * Builds the per-user activity report behind the admin drill-down.
 *
 * The question this exists to answer is "where did this person give up, and
 * why" — so the shape is deliberately journey-first rather than a pile of
 * counts. Everything is derived from ActivityEvent plus the domain tables; no
 * new storage.
 *
 * Two derivations carry most of the value:
 *   - visits, reconstructed by grouping page views on visitId. The LAST page of
 *     the LAST visit is the exit point, which is the single most useful field
 *     in here.
 *   - funnel, which pairs starts against completions so an abandoned session
 *     (started, never finished) becomes visible. Completion-only tables cannot
 *     express that, which is why "no sessions" was previously ambiguous between
 *     "never tried" and "tried and hit a wall".
 */

export type VisitSummary = {
  visitId: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  pageCount: number;
  /** Ordered, de-duplicated consecutive paths — the actual journey. */
  path: string[];
  entryPage: string;
  exitPage: string;
  referrer: string | null;
};

export type UserActivityReport = Awaited<ReturnType<typeof buildUserActivityReport>>;

type EventRow = {
  event: string;
  plan: string | null;
  isTrial: boolean;
  detail: unknown;
  createdAt: Date;
};

function detailOf(row: EventRow): Record<string, unknown> {
  return row.detail && typeof row.detail === "object"
    ? (row.detail as Record<string, unknown>)
    : {};
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Group page views into visits and derive entry/exit/duration for each. */
function buildVisits(events: EventRow[]): VisitSummary[] {
  const views = events.filter((e) => e.event === ACTIVITY_EVENTS.PAGE_VIEW);
  const byVisit = new Map<string, EventRow[]>();

  for (const v of views) {
    const id = str(detailOf(v).visitId) ?? "unknown";
    const list = byVisit.get(id);
    if (list) list.push(v);
    else byVisit.set(id, [v]);
  }

  const visits: VisitSummary[] = [];
  for (const [visitId, rows] of byVisit) {
    rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Prefer summed dwell: it measures time actually on screen. Wall-clock
    // between first and last event is the fallback, and over-counts a tab left
    // open in the background.
    const dwellTotal = rows.reduce((acc, r) => acc + num(detailOf(r).dwellMs), 0);
    const wallClock =
      rows[rows.length - 1].createdAt.getTime() - rows[0].createdAt.getTime();

    const paths: string[] = [];
    for (const r of rows) {
      const p = str(detailOf(r).path);
      if (p && p !== paths[paths.length - 1]) paths.push(p);
    }

    visits.push({
      visitId,
      startedAt: rows[0].createdAt.toISOString(),
      endedAt: rows[rows.length - 1].createdAt.toISOString(),
      durationMs: dwellTotal > 0 ? dwellTotal : Math.max(0, wallClock),
      pageCount: rows.length,
      path: paths,
      entryPage: paths[0] ?? "unknown",
      exitPage: paths[paths.length - 1] ?? "unknown",
      referrer: str(detailOf(rows[0]).referrer),
    });
  }

  return visits.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function buildUserActivityReport(clerkUserId: string) {
  const [profile, events, practice, acs, docs, emailPref, terms] = await Promise.all([
    prisma.userProfile.findUnique({ where: { clerkUserId } }),
    prisma.activityEvent.findMany({
      where: { clerkUserId },
      orderBy: { createdAt: "asc" },
      // Bounded so one heavy user cannot make the admin page unloadable.
      take: 5000,
      select: { event: true, plan: true, isTrial: true, detail: true, createdAt: true },
    }),
    prisma.practiceSession.findMany({
      where: { clerkUserId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, role: true, interviewType: true, difficulty: true,
        practiceMode: true, totalQuestions: true, overallScore: true,
        hireSignal: true, createdAt: true,
      },
    }),
    prisma.assessmentCentreSession.findMany({
      where: { clerkUserId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, role: true, status: true, currentStage: true,
        selectedStages: true, caseStudyScore: true, interviewScore: true,
        presentationScore: true, overallScore: true, completedAt: true,
        createdAt: true, updatedAt: true,
      },
    }),
    prisma.careerDocGeneration.findMany({
      where: { clerkUserId },
      orderBy: { createdAt: "desc" },
      select: { kind: true, createdAt: true },
    }),
    prisma.emailPreference.findUnique({ where: { clerkUserId } }),
    prisma.termsAcceptance.findMany({
      where: { clerkUserId },
      orderBy: { acceptedAt: "desc" },
      select: { version: true, acceptedAt: true },
    }),
  ]);

  const visits = buildVisits(events);
  const totalTimeMs = visits.reduce((a, v) => a + v.durationMs, 0);

  const count = (name: string) => events.filter((e) => e.event === name).length;

  const practiceStarted = count(ACTIVITY_EVENTS.PRACTICE_STARTED);
  const practiceCompleted = count(ACTIVITY_EVENTS.PRACTICE_COMPLETED);
  const acStarted = count(ACTIVITY_EVENTS.AC_STARTED);

  // Page popularity — "what they read", ranked by time rather than hits, since
  // a long dwell says far more about interest than a bounce through a nav link.
  const pageStats = new Map<string, { views: number; totalMs: number }>();
  for (const e of events) {
    if (e.event !== ACTIVITY_EVENTS.PAGE_VIEW) continue;
    const p = str(detailOf(e).path);
    if (!p) continue;
    const cur = pageStats.get(p) ?? { views: 0, totalMs: 0 };
    cur.views += 1;
    cur.totalMs += num(detailOf(e).dwellMs);
    pageStats.set(p, cur);
  }
  const topPages = [...pageStats.entries()]
    .map(([path, s]) => ({ path, ...s }))
    .sort((a, b) => b.totalMs - a.totalMs || b.views - a.views)
    .slice(0, 25);

  const chats = events
    .filter((e) => e.event === ACTIVITY_EVENTS.CHAT_MESSAGE)
    .map((e) => ({
      at: e.createdAt.toISOString(),
      question: str(detailOf(e).question),
      chars: num(detailOf(e).chars),
    }));

  const toolsUsed = events
    .filter((e) => e.event === ACTIVITY_EVENTS.TOOL_USED)
    .map((e) => ({ at: e.createdAt.toISOString(), tool: str(detailOf(e).tool) ?? "unknown" }));

  // Turned-away attempts: the clearest statement of intent the data contains,
  // because the user asked for something and the product said no.
  const blocked = events
    .filter(
      (e) =>
        e.event === ACTIVITY_EVENTS.AC_BLOCKED ||
        e.event === ACTIVITY_EVENTS.CAREER_DOC_BLOCKED ||
        e.event === ACTIVITY_EVENTS.PRACTICE_CAPPED
    )
    .map((e) => ({
      at: e.createdAt.toISOString(),
      event: e.event,
      plan: e.plan,
      isTrial: e.isTrial,
      detail: detailOf(e),
    }));

  const interactions = events
    .filter((e) => e.event === ACTIVITY_EVENTS.INTERACTION)
    .map((e) => ({
      at: e.createdAt.toISOString(),
      action: str(detailOf(e).action) ?? "unknown",
      path: str(detailOf(e).path),
    }));

  // Assessment centres are the richest abandonment signal in the product: the
  // row records the stage reached even when the run was never finished.
  const acProgress = acs.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    completedAt: a.completedAt?.toISOString() ?? null,
    abandonedAtStage: a.status === "complete" ? null : a.currentStage,
  }));

  return {
    profile: profile
      ? {
          signupCountry: profile.signupCountry,
          utmSource: profile.utmSource,
          utmMedium: profile.utmMedium,
          utmCampaign: profile.utmCampaign,
          promoCode: profile.promoCode,
          referrer: profile.referrer,
          landingPath: profile.landingPath,
          createdAt: profile.createdAt.toISOString(),
          hasCv: profile.cvText.trim().length > 0,
          cvChars: profile.cvText.trim().length,
          hasRoleSpec: profile.roleSpec.trim().length > 0,
          interviewGoals: profile.interviewGoals || null,
          preferredPracticeMode: profile.preferredPracticeMode,
          tosAcceptedAt: profile.tosAcceptedAt?.toISOString() ?? null,
        }
      : null,

    engagement: {
      visitCount: visits.length,
      totalTimeMs,
      averageVisitMs: visits.length ? Math.round(totalTimeMs / visits.length) : 0,
      totalPageViews: count(ACTIVITY_EVENTS.PAGE_VIEW),
      firstSeen: events[0]?.createdAt.toISOString() ?? null,
      lastSeen: events[events.length - 1]?.createdAt.toISOString() ?? null,
      /** Where they were when they last left. The headline drop-off signal. */
      lastExitPage: visits[0]?.exitPage ?? null,
    },

    funnel: {
      // Completions come from the domain tables, not the event stream: those
      // rows predate instrumentation, so counting events here would report
      // "0 completed" for a user with six saved sessions on screen.
      practiceStarted: Math.max(practiceStarted, practice.length),
      practiceCompleted: practice.length,
      /**
       * Started but never reached a saved summary. Only meaningful once start
       * events exist — for pre-instrumentation users starts are unknown, and
       * inferring abandonment from their absence would invent a number.
       */
      practiceAbandoned:
        practiceStarted > 0 ? Math.max(0, practiceStarted - practice.length) : null,
      /** False when this user's history predates start tracking. */
      practiceAbandonmentKnown: practiceStarted > 0,
      acStarted: Math.max(acStarted, acs.length),
      acCompleted: acs.filter((a) => a.status === "complete").length,
      acAbandoned: acs.filter((a) => a.status !== "complete").length,
      careerDocs: docs.length,
      blockedAttempts: blocked.length,
    },

    visits: visits.slice(0, 50),
    topPages,
    practiceSessions: practice.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    assessmentCentres: acProgress,
    careerDocs: docs.map((d) => ({ kind: d.kind, at: d.createdAt.toISOString() })),
    chats,
    toolsUsed,
    blocked,
    interactions: interactions.slice(-100),

    consent: {
      marketingConsent: emailPref?.marketingConsent ?? null,
      consentSource: emailPref?.consentSource ?? null,
      termsVersions: terms.map((t) => ({
        version: t.version,
        at: t.acceptedAt.toISOString(),
      })),
    },

    /** True when telemetry predates this user — their journey is unrecoverable. */
    telemetryStartedAfterSignup:
      !!profile && events.length > 0
        ? events[0].createdAt.getTime() > profile.createdAt.getTime() + 60_000
        : null,
  };
}
