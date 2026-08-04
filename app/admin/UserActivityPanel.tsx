"use client";

import { useEffect, useState } from "react";

/**
 * Per-user activity drill-down.
 *
 * Ordered so the answer to "why did they leave" is at the top: headline
 * engagement, then the funnel with abandonment made explicit, then the visit
 * journeys, and only then the raw detail. A wall of counts would technically
 * contain the same data while burying the one line that matters.
 */

type Report = {
  identity: {
    email: string | null;
    name: string | null;
    createdAt: string | null;
    lastSignInAt: string | null;
    plan: { planName: string; isTrial: boolean; trialConsumed: boolean } | null;
  };
  profile: Record<string, unknown> | null;
  engagement: {
    visitCount: number;
    totalTimeMs: number;
    averageVisitMs: number;
    totalPageViews: number;
    firstSeen: string | null;
    lastSeen: string | null;
    lastExitPage: string | null;
  };
  funnel: {
    practiceStarted: number;
    practiceCompleted: number;
    practiceAbandoned: number | null;
    practiceAbandonmentKnown: boolean;
    acStarted: number;
    acCompleted: number;
    acAbandoned: number;
    careerDocs: number;
    blockedAttempts: number;
  };
  visits: Array<{
    visitId: string; startedAt: string; durationMs: number; pageCount: number;
    path: string[]; entryPage: string; exitPage: string; referrer: string | null;
  }>;
  topPages: Array<{ path: string; views: number; totalMs: number }>;
  practiceSessions: Array<{
    id: string; role: string; overallScore: number; hireSignal: string;
    practiceMode: string; totalQuestions: number; createdAt: string;
  }>;
  assessmentCentres: Array<{
    id: string; role: string; status: string; currentStage: number;
    abandonedAtStage: number | null; overallScore: number | null; createdAt: string;
  }>;
  careerDocs: Array<{ kind: string; at: string }>;
  chats: Array<{ at: string; question: string | null; chars: number }>;
  toolsUsed: Array<{ at: string; tool: string }>;
  blocked: Array<{ at: string; event: string; plan: string | null; isTrial: boolean; detail: Record<string, unknown> }>;
  interactions: Array<{ at: string; action: string; path: string | null }>;
  consent: {
    marketingConsent: boolean | null;
    consentSource: string | null;
    termsVersions: Array<{ version: string; at: string }>;
  };
  telemetryStartedAfterSignup: boolean | null;
};

function fmtDuration(ms: number): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const CARD = "rounded-[1.25rem] border border-white/[0.08] bg-white/[0.03] p-4";
const H = "text-[11px] font-bold tracking-wide text-purple-300/90";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" | "good" }) {
  const colour =
    tone === "warn" ? "text-amber-300" : tone === "good" ? "text-emerald-300" : "text-white";
  return (
    <div className="rounded-[1rem] border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
      <p className="text-[10px] font-bold tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${colour}`}>{value}</p>
    </div>
  );
}

export function UserActivityPanel({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setReport(null);
    setError("");
    fetch(`/api/admin/users/${userId}/activity`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? r.statusText);
        return r.json() as Promise<Report>;
      })
      .then((d) => { if (!cancelled) setReport(d); })
      .catch((e) => { if (!cancelled) setError(String(e.message ?? e)); });
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-[1.75rem] border border-purple-400/20 bg-[#120a1e] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {report?.identity.name || report?.identity.email || "User activity"}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {report?.identity.email} · {report?.identity.plan?.planName ?? "—"}
              {report?.identity.plan?.isTrial ? " (on trial)" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[0.09]"
          >
            Close
          </button>
        </div>

        {error && (
          <p className="rounded-[1rem] border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        )}
        {!report && !error && <p className="py-10 text-center text-sm text-gray-500">Loading activity…</p>}

        {report && (
          <div className="space-y-5">
            {report.telemetryStartedAfterSignup && (
              <p className="rounded-[1rem] border border-amber-400/25 bg-amber-400/[0.08] p-3 text-xs text-amber-200">
                This user signed up before behavioural tracking existed. Visits, time on site and page
                journeys below cover only the period since tracking began — earlier activity was never
                recorded and cannot be recovered.
              </p>
            )}

            {/* Headline: the drop-off answer first */}
            <section>
              <p className={H}>Engagement</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <Stat label="Visits" value={String(report.engagement.visitCount)} />
                <Stat label="Total time" value={fmtDuration(report.engagement.totalTimeMs)} />
                <Stat label="Avg / visit" value={fmtDuration(report.engagement.averageVisitMs)} />
                <Stat label="Page views" value={String(report.engagement.totalPageViews)} />
                <Stat
                  label="Left from"
                  value={report.engagement.lastExitPage ?? "—"}
                  tone="warn"
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                First seen {fmtDate(report.engagement.firstSeen)} · last seen{" "}
                {fmtDate(report.engagement.lastSeen)} · last sign-in{" "}
                {fmtDate(report.identity.lastSignInAt)}
              </p>
            </section>

            {/* Funnel with abandonment explicit */}
            <section>
              <p className={H}>Funnel</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat
                  label="Practice started"
                  value={String(report.funnel.practiceStarted)}
                />
                <Stat
                  label="Completed"
                  value={String(report.funnel.practiceCompleted)}
                  tone={report.funnel.practiceCompleted > 0 ? "good" : undefined}
                />
                <Stat
                  label="Abandoned"
                  value={
                    report.funnel.practiceAbandonmentKnown
                      ? String(report.funnel.practiceAbandoned ?? 0)
                      : "n/a"
                  }
                  tone={(report.funnel.practiceAbandoned ?? 0) > 0 ? "warn" : undefined}
                />
                <Stat
                  label="Blocked by plan"
                  value={String(report.funnel.blockedAttempts)}
                  tone={report.funnel.blockedAttempts > 0 ? "warn" : undefined}
                />
                <Stat label="AC started" value={String(report.funnel.acStarted)} />
                <Stat label="AC completed" value={String(report.funnel.acCompleted)} />
                <Stat
                  label="AC abandoned"
                  value={String(report.funnel.acAbandoned)}
                  tone={report.funnel.acAbandoned > 0 ? "warn" : undefined}
                />
                <Stat label="Career docs" value={String(report.funnel.careerDocs)} />
              </div>
            </section>

            {/* Turned-away attempts — strongest intent signal we hold */}
            {report.blocked.length > 0 && (
              <section className={CARD}>
                <p className={H}>Wanted but was refused</p>
                <ul className="mt-2 space-y-1.5">
                  {report.blocked.map((b, i) => (
                    <li key={i} className="text-xs text-gray-300">
                      <span className="text-amber-300">{b.event}</span> · {fmtDate(b.at)} · plan{" "}
                      {b.plan ?? "—"}
                      {b.isTrial ? " (trial)" : ""}
                      {typeof b.detail.reason === "string" ? ` · ${b.detail.reason}` : ""}
                      {typeof b.detail.tool === "string" ? ` · ${b.detail.tool}` : ""}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Visit journeys */}
            <section className={CARD}>
              <p className={H}>Visits — where each one ended</p>
              {report.visits.length === 0 ? (
                <p className="mt-2 text-xs text-gray-500">No page-view telemetry for this user yet.</p>
              ) : (
                <div className="mt-2 space-y-2.5">
                  {report.visits.map((v) => (
                    <div key={v.visitId} className="rounded-[0.9rem] border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="text-[11px] text-gray-400">
                        {fmtDate(v.startedAt)} · {fmtDuration(v.durationMs)} · {v.pageCount} views
                        {v.referrer ? ` · from ${v.referrer}` : ""}
                      </p>
                      <p className="mt-1.5 break-words text-xs text-gray-300">
                        {v.path.map((p, i) => (
                          <span key={i}>
                            {i > 0 && <span className="text-gray-600"> → </span>}
                            <span className={i === v.path.length - 1 ? "font-bold text-amber-300" : ""}>
                              {p}
                            </span>
                          </span>
                        ))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* What held their attention */}
            {report.topPages.length > 0 && (
              <section className={CARD}>
                <p className={H}>What they read — ranked by time</p>
                <table className="mt-2 w-full text-xs">
                  <tbody>
                    {report.topPages.map((p) => (
                      <tr key={p.path} className="border-b border-white/[0.05] last:border-0">
                        <td className="py-1.5 pr-3 text-gray-300">{p.path}</td>
                        <td className="py-1.5 pr-3 text-right text-gray-500">{p.views}×</td>
                        <td className="py-1.5 text-right font-bold text-white">{fmtDuration(p.totalMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* Chat — the "why" */}
            {report.chats.length > 0 && (
              <section className={CARD}>
                <p className={H}>Asked the AI mentor</p>
                <ul className="mt-2 space-y-2">
                  {report.chats.map((c, i) => (
                    <li key={i} className="text-xs">
                      <span className="text-gray-500">{fmtDate(c.at)}</span>
                      <p className="mt-0.5 text-gray-200">“{c.question ?? `(${c.chars} chars)`}”</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Sessions */}
            <section className={CARD}>
              <p className={H}>Practice sessions</p>
              {report.practiceSessions.length === 0 ? (
                <p className="mt-2 text-xs text-gray-500">None completed.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {report.practiceSessions.map((s) => (
                    <li key={s.id} className="text-xs text-gray-300">
                      {fmtDate(s.createdAt)} · {s.role} · {s.practiceMode} ·{" "}
                      <span className="font-bold text-white">{s.overallScore}/10</span> · {s.hireSignal}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {report.assessmentCentres.length > 0 && (
              <section className={CARD}>
                <p className={H}>Assessment centres</p>
                <ul className="mt-2 space-y-1.5">
                  {report.assessmentCentres.map((a) => (
                    <li key={a.id} className="text-xs text-gray-300">
                      {fmtDate(a.createdAt)} · {a.role} · status {a.status}
                      {a.abandonedAtStage !== null ? (
                        <span className="font-bold text-amber-300">
                          {" "}· abandoned at stage {a.abandonedAtStage}
                        </span>
                      ) : (
                        <span className="text-emerald-300"> · completed ({a.overallScore}/10)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(report.toolsUsed.length > 0 || report.careerDocs.length > 0) && (
              <section className={CARD}>
                <p className={H}>Tools</p>
                <ul className="mt-2 space-y-1 text-xs text-gray-300">
                  {report.toolsUsed.map((t, i) => (
                    <li key={`t${i}`}>{fmtDate(t.at)} · {t.tool}</li>
                  ))}
                  {report.careerDocs.map((d, i) => (
                    <li key={`d${i}`}>{fmtDate(d.at)} · {d.kind}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Acquisition + profile intent */}
            <section className={CARD}>
              <p className={H}>Signup &amp; intent</p>
              <div className="mt-2 grid gap-1 text-xs text-gray-300 sm:grid-cols-2">
                <p>Country: {String(report.profile?.signupCountry ?? "—")}</p>
                <p>Landed on: {String(report.profile?.landingPath ?? "—")}</p>
                <p>Referrer: {String(report.profile?.referrer ?? "—")}</p>
                <p>
                  UTM: {String(report.profile?.utmSource ?? "—")} /{" "}
                  {String(report.profile?.utmMedium ?? "—")}
                </p>
                <p>
                  CV uploaded:{" "}
                  {report.profile?.hasCv ? `yes (${String(report.profile?.cvChars)} chars)` : "no"}
                </p>
                <p>Role spec: {report.profile?.hasRoleSpec ? "yes" : "no"}</p>
                <p className="sm:col-span-2">
                  Goals: {String(report.profile?.interviewGoals ?? "—")}
                </p>
                <p>
                  Marketing consent:{" "}
                  {report.consent.marketingConsent === null
                    ? "—"
                    : report.consent.marketingConsent
                    ? "yes"
                    : "no"}
                </p>
                <p>Terms accepted: {fmtDate(report.consent.termsVersions[0]?.at ?? null)}</p>
              </div>
            </section>

            {report.interactions.length > 0 && (
              <section className={CARD}>
                <p className={H}>Recent interactions</p>
                <ul className="mt-2 space-y-1 text-xs text-gray-400">
                  {report.interactions.slice(-25).reverse().map((a, i) => (
                    <li key={i}>{fmtDate(a.at)} · {a.action}{a.path ? ` · ${a.path}` : ""}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
