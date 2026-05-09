/**
 * Helpers for distinguishing a candidate's PERSONAL practice sessions from
 * sessions that were taken as part of a company-issued assessment.
 *
 * Rule: a PracticeSession that is linked to a CandidateAssignment row
 * (either via CandidateAssignment.sessionId or because the candidate's
 * userId is on a completed CandidateAssignment) is owned by the hiring
 * company, not by the candidate. The candidate executed it but never
 * commissioned it, so they don't get to see the scores.
 *
 * The candidate-facing endpoints (/api/practice-sessions and its [id]
 * sibling, plus /progress and /progress/[id]) use these helpers to
 * exclude assessment-linked sessions from view. The hiring team accesses
 * the same data via /api/company/results/* which is allowed by company
 * membership.
 */

import { prisma } from "./prisma";

/**
 * Get the set of PracticeSession ids belonging to this user that are
 * linked to a company assessment. Empty set if none.
 */
export async function getAssessmentLinkedSessionIds(
  clerkUserId: string
): Promise<Set<string>> {
  const rows = await prisma.candidateAssignment.findMany({
    where: { clerkUserId, sessionId: { not: null } },
    select: { sessionId: true },
  });
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.sessionId) ids.add(row.sessionId);
  }
  return ids;
}

/**
 * Returns true if the given session id was completed as part of a company
 * assessment for this user. Used to gate /api/practice-sessions/[id].
 */
export async function isAssessmentLinkedSession(
  clerkUserId: string,
  sessionId: string
): Promise<boolean> {
  const assignment = await prisma.candidateAssignment.findFirst({
    where: { clerkUserId, sessionId },
    select: { id: true },
  });
  return Boolean(assignment);
}
