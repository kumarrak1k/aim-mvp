/**
 * Shared prompt builder for the assessment centre stage-1 case study.
 * Used by BOTH generation routes (candidate /api/assessment-centre/start and
 * corporate /api/assessment/[token]/start-ac) so the calibration can't drift.
 *
 * Calibration: aligned to the written case exercise at a Big 4 / investment
 * bank GRADUATE assessment centre — a short brief (~1 page + a few simple
 * exhibits) testing structure and commercial judgement, not data-crunching
 * stamina. Reading is untimed in our flow; the 12-minute timer starts when
 * the candidate begins WRITING, so the pack must be digestible in about
 * 5 minutes and answerable with a concise structured recommendation.
 * (The original prompt requested a McKinsey-depth multi-exhibit pack —
 * far beyond what any graduate AC written exercise actually uses.)
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
  const systemPrompt = `You are a senior assessment centre designer who has run graduate and professional assessment centres for Big 4 firms and investment banks. You create realistic written case exercises matching the calibre those employers actually use: a short, sharp brief with a few simple exhibits that tests structured thinking and commercial judgement — never volume or complex financial engineering. Output must be valid JSON only — no markdown fences, no commentary.`;

  const userPrompt = `Create a written case exercise for a ${role} candidate (${experienceLevel}) in the ${sector} sector or organisation context, at the standard of a Big 4 / investment bank graduate assessment centre written exercise.

CALIBRATION: the candidate reads the case untimed (it should take about 5 minutes), then has 12 minutes to WRITE a structured recommendation. The whole pack (overview + challenge + exhibits + task + question) must total roughly 450-600 words. The test is structure and judgement, not reading stamina — depth comes from a clear trade-off in the data.

OVERVIEW (overview field): ONE paragraph, 80-110 words: who the company is, its size (a revenue or headcount figure), what it sells, its market position, and one line of strategic context. No company-history essay.

CHALLENGE (challenge field): ONE paragraph, 80-110 words: a single focused business decision with a genuine trade-off, what triggered it, and what is at stake. There must be 2-3 plausible options with no single obvious answer.

EXHIBITS (exhibits field): EXACTLY 3 exhibits. Each exhibit content MUST be a STRING (not an array) containing one compact markdown pipe table — maximum 6 data rows and 4 columns — plus at most one short caption sentence. Keep the numbers graduate-friendly: clear trends and simple percentages a candidate can work with mentally — no DCFs or dense financial statements. The exhibits must not all point the same way:
- Exhibit 1: a financial or performance snapshot (e.g. 3-year revenue/margin mini-table, or KPIs vs budget)
- Exhibit 2: a market or customer signal (e.g. NPS or churn by segment, market share trend, competitor comparison)
- Exhibit 3: the tension — data that complicates the obvious answer (e.g. workforce/capacity constraint, cost of each option, risk indicators)

TASK (task field): 2-3 sentences: the role the candidate is playing, who they are advising (a named senior stakeholder), and the deliverable — a short structured written recommendation.

QUESTION (question field): One specific decision question that requires drawing on at least two exhibits and committing to a recommendation.

GUIDANCE (guidance field): EXACTLY 4 short tips (one line each) on structuring a strong graduate-level answer: leading with the recommendation, using the data selectively, weighing the trade-off, and covering risks/next steps.

Calibrate to the candidate's level (${experienceLevel}): keep the graduate-AC format and length always; for more senior candidates sharpen the stakeholder tension and make the data slightly more ambiguous — never longer.

Return valid JSON matching this schema exactly:
{ "company": string, "industry": string, "overview": string, "challenge": string, "exhibits": [{"title": string, "content": string}], "task": string, "question": string, "guidance": string[] }`;

  return { systemPrompt, userPrompt };
}
