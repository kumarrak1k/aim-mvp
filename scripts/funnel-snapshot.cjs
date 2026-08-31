/* Read-only activation-funnel snapshot from the production DB. */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function pct(a, b) { return b ? ((100 * a) / b).toFixed(1) + "%" : "n/a"; }
function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

(async () => {
  const profiles = await prisma.userProfile.findMany({
    select: {
      clerkUserId: true, tosAcceptedAt: true, onboardingCompletedAt: true,
      onboardingSkipped: true, utmSource: true, landingPath: true,
      targetRole: true, cvText: true,
    },
  });
  const sessions = await prisma.practiceSession.findMany({
    select: { clerkUserId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const trials = await prisma.trialGrant.findMany({ select: { clerkUserId: true, createdAt: true } });
  const acSessions = await prisma.assessmentCentreSession.count();
  const careerDocs = await prisma.careerDocGeneration.count().catch(() => -1);

  const firstSession = new Map();
  const sessionCount = new Map();
  for (const s of sessions) {
    if (!firstSession.has(s.clerkUserId)) firstSession.set(s.clerkUserId, s.createdAt);
    sessionCount.set(s.clerkUserId, (sessionCount.get(s.clerkUserId) ?? 0) + 1);
  }

  const total = profiles.length;
  const onboarded = profiles.filter((p) => p.onboardingCompletedAt).length;
  const skipped = profiles.filter((p) => p.onboardingSkipped).length;
  const withRole = profiles.filter((p) => p.targetRole).length;
  const withCv = profiles.filter((p) => p.cvText && p.cvText.length > 100).length;
  const activated = profiles.filter((p) => firstSession.has(p.clerkUserId));
  const multiSession = profiles.filter((p) => (sessionCount.get(p.clerkUserId) ?? 0) >= 2).length;
  const trialUsers = new Set(trials.map((t) => t.clerkUserId));
  const trialActivated = [...trialUsers].filter((id) => firstSession.has(id)).length;

  // Time from signup (ToS accept) to first completed session, in hours.
  const gaps = [];
  for (const p of activated) {
    if (!p.tosAcceptedAt) continue;
    const gap = (firstSession.get(p.clerkUserId) - p.tosAcceptedAt) / 36e5;
    if (gap >= 0) gaps.push(gap);
  }

  // Signups + activation by 30-day recency
  const cut = Date.now() - 30 * 864e5;
  const recent = profiles.filter((p) => p.tosAcceptedAt && p.tosAcceptedAt.getTime() > cut);
  const recentActivated = recent.filter((p) => firstSession.has(p.clerkUserId)).length;

  // Attribution spread
  const bySource = {};
  for (const p of profiles) {
    const k = p.utmSource || "(none)";
    bySource[k] = (bySource[k] ?? 0) + 1;
  }
  const byLanding = {};
  for (const p of profiles) {
    const k = p.landingPath || "(none)";
    byLanding[k] = (byLanding[k] ?? 0) + 1;
  }

  // Session-count distribution
  const dist = { "1": 0, "2-4": 0, "5-9": 0, "10+": 0 };
  for (const n of sessionCount.values()) {
    if (n === 1) dist["1"]++; else if (n <= 4) dist["2-4"]++; else if (n <= 9) dist["5-9"]++; else dist["10+"]++;
  }

  console.log(JSON.stringify({
    signups_total: total,
    signups_last30d: recent.length,
    onboarding_completed: onboarded + " (" + pct(onboarded, total) + ")",
    onboarding_skipped: skipped,
    profile_has_target_role: withRole + " (" + pct(withRole, total) + ")",
    profile_has_cv: withCv + " (" + pct(withCv, total) + ")",
    activated_ever: activated.length + " (" + pct(activated.length, total) + ")",
    activated_last30d_of_recent_signups: recentActivated + " of " + recent.length + " (" + pct(recentActivated, recent.length) + ")",
    returned_2plus_sessions: multiSession + " (" + pct(multiSession, activated.length) + " of activated)",
    session_count_distribution: dist,
    trial_grants: trials.length,
    trial_users_activated: trialActivated + " of " + trialUsers.size,
    median_hours_signup_to_first_session: gaps.length ? +median(gaps).toFixed(1) : null,
    gaps_over_24h: gaps.filter((g) => g > 24).length + " of " + gaps.length,
    ac_sessions_total: acSessions,
    career_doc_generations: careerDocs,
    signups_by_utm_source: bySource,
    signups_by_landing_path: Object.fromEntries(Object.entries(byLanding).sort((a, b) => b[1] - a[1]).slice(0, 10)),
  }, null, 1));
  await prisma.$disconnect();
})();
