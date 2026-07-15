/**
 * Shared prompt builder for the assessment centre stage-1 case study.
 * Used by BOTH generation routes (candidate /api/assessment-centre/start and
 * corporate /api/assessment/[token]/start-ac) so the calibration can't drift.
 *
 * Calibration: stage 1 is a 12-MINUTE timed exercise — the candidate must
 * read the case AND write a structured response inside that window. Real
 * assessment-centre written exercises at this duration are one-page briefs,
 * so the prompt hard-caps the reading load (~350 words, 2 compact exhibits)
 * and scales difficulty through ambiguity in the data, never through volume.
 * (The previous prompt requested a McKinsey-depth multi-exhibit pack, which
 * candidates could not even finish reading in 12 minutes.)
 */
export function buildCaseStudyPrompts({
  role,
  sector,
  experienceLevel,
}: {
  role: string;
  sector: string;
  experienceLevel: string;
}): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a senior assessment centre designer. You create realistic TIMED written case exercises for graduate and professional assessment centres, calibrated so a strong candidate can read everything in 2-3 minutes and spend the remaining time writing a structured response. Output must be valid JSON only — no markdown fences, no commentary.`;

  const userPrompt = `Create a realistic 12-minute written case exercise for a ${role} candidate (${experienceLevel}) in the ${sector} sector or organisation context.

HARD TIME CONSTRAINT: the candidate has 12 minutes TOTAL to read the case AND write their response. The combined reading load (overview + challenge + exhibits + task + question) must not exceed roughly 350 words. Depth must come from a sharp, genuine trade-off in the data — never from volume.

OVERVIEW (overview field): ONE paragraph, 60-90 words: who the company is, its size (one revenue or headcount figure), what it sells, and its market position. No company history.

CHALLENGE (challenge field): ONE paragraph, 60-90 words: a single focused business problem with a genuine trade-off and something clearly at stake. It must not have one obvious answer.

EXHIBITS (exhibits field): EXACTLY 2 exhibits. Each exhibit content MUST be a STRING (not an array) containing one compact markdown pipe table — maximum 5 data rows and 4 columns — plus at most one short caption sentence. The two exhibits must point in slightly different directions so the candidate has to weigh them against each other:
- Exhibit 1: a financial or operational snapshot (e.g. 3-year revenue/margin mini-table, or KPIs vs benchmark)
- Exhibit 2: a customer, market, or workforce signal (e.g. NPS by segment, churn trend, share by segment)

TASK (task field): 1-2 sentences: the role the candidate is playing and the deliverable — a short structured recommendation to a named senior stakeholder.

QUESTION (question field): One specific question that requires using BOTH exhibits and ends in a clear recommendation.

GUIDANCE (guidance field): EXACTLY 3 short tips (one line each) on structuring a strong answer under time pressure.

Calibrate complexity to the candidate's level (${experienceLevel}): for graduate/entry level keep the numbers simple and the trade-off visible; for senior levels make the data more ambiguous and the stakeholder tension sharper — but NEVER increase the length.

Return valid JSON matching this schema exactly:
{ "company": string, "industry": string, "overview": string, "challenge": string, "exhibits": [{"title": string, "content": string}], "task": string, "question": string, "guidance": string[] }`;

  return { systemPrompt, userPrompt };
}
