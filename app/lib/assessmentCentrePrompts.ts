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
/**
 * Shared scoring calibration for the assessment centre markers.
 *
 * The practice module was recalibrated after users found it too harsh (see
 * "Recalibrate scoring: usable top end"), but that change only reached
 * /api/feedback and /api/summary. The assessment centre markers were left
 * telling the model to "score rigorously and honestly" with no band
 * definitions, which reliably produces harsh, middle-clustered marks: with no
 * anchor for what a 9 looks like, models default to withholding the top of the
 * scale.
 *
 * These bands are deliberately two-sided. Candidates re-run assessments to see
 * progress, so the top must be reachable; but an unusable top end and an
 * inflated one are both failures, so the lower bands are explicit too.
 */
export const AC_SCORING_CALIBRATION = `CALIBRATION: you are a fair, calibrated assessor, neither a soft tutor nor a gatekeeper. Candidates use these scores to track progress between attempts, so the top of the scale must be genuinely reachable and every band must be applied honestly.

Scoring bands (apply to EACH category and to the overall score):
- 10   Outstanding. Would stand out in a competitive graduate assessment centre.
- 9    Excellent. Meets the standard fully; at most one dimension slightly thinner.
- 7-8  Strong. Does what was asked with a clear line of reasoning, but light on one
       of: use of the specific material provided, commitment to a recommendation,
       or risks and next steps.
- 5-6  Adequate. Addresses the task but stays generic: little use of the material
       given, or states conclusions without supporting them.
- 3-4  Weak. Vague, or largely restates the brief without analysis of its own.
- 0-2  Non-answer, or does not address the task set.

Do not cluster scores in the middle. If the work meets a band, award that band: 9 and 10 are attainable and must be given when the criteria are met. Equally, do not inflate: a genuinely generic response is a 5, not a 7.

Judge against what is achievable within the time allowed, not against an unhurried, polished submission.`;

/**
 * Presentation brief (stage 3).
 *
 * Shared by the start route (when stage 3 runs standalone) and the
 * submit-interview route (when stage 3 follows the interview). Kept here so the
 * two callers cannot drift: they previously held identical inline copies, and a
 * fix to one would silently miss the other.
 *
 * The fictional-company guard matters as much here as in the case study. The
 * target role is free text and frequently names a real employer, and without
 * this the model builds the brief around that real organisation and invents
 * facts about it.
 */
export function buildPresentationBriefPrompts({
  role,
  sector,
}: {
  role: string;
  sector: string;
}): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a senior assessment centre designer. Generate a realistic presentation brief appropriate for a ${role} candidate in the ${sector} sector. JSON only.

CRITICAL: any organisation referred to in the brief MUST be fictional, with invented figures. Never name a real company, and never lightly disguise one. If the candidate's target role text names an employer, use it only to infer the sector and type of business, never as the subject of the brief.`;

  const userPrompt = `Generate a presentation brief for a ${role} in ${sector}. Any company referenced must be fictional with invented figures. Return JSON: { "topic": "<topic string>", "audience": "<audience string>", "context": "<2-3 sentences of background>", "format": "3-minute spoken presentation", "objectives": ["<objective 1>", "<objective 2>", "<objective 3>"], "timeMinutes": 3 }`;

  return { systemPrompt, userPrompt };
}

export function buildCaseStudyPrompts({
  role,
  sector,
  experienceLevel,
}: {
  role: string;
  sector: string;
  experienceLevel: string;
}): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a senior assessment centre designer who has run graduate and professional assessment centres for Big 4 firms and investment banks. You create realistic written case exercises matching the calibre those employers actually use: a short, sharp brief with a few simple exhibits that tests structured thinking and commercial judgement — never volume or complex financial engineering. Output must be valid JSON only — no markdown fences, no commentary.

CRITICAL: the case company MUST be fictional. Real employers never set case studies about real named organisations, because the exercise tests reasoning about an unfamiliar business, not recall. Invent a plausible company name and invent all of its figures. Never use the name of a real company, and never use a real company's name with a minor alteration. If the candidate's target role text names an employer, use that only to infer the sector and the type of business, never as the case subject.`;

  const userPrompt = `Create a written case exercise for a ${role} candidate (${experienceLevel}) in the ${sector} sector or organisation context, at the standard of a Big 4 / investment bank graduate assessment centre written exercise.

CALIBRATION: the candidate reads the case untimed (it should take about 5 minutes), then has 12 minutes to WRITE a structured recommendation. The whole pack (overview + challenge + exhibits + task + question) must total roughly 450-600 words. The test is structure and judgement, not reading stamina — depth comes from a clear trade-off in the data.

COMPANY (company field): a FICTIONAL organisation, invented for this exercise. Give it a plausible but clearly made-up name appropriate to the sector. Do NOT name a real company, and do NOT lightly disguise one. Where the target role text mentions an employer, mirror only the shape of that business (its sector, scale and operating model), never its identity. All figures throughout the pack are invented for the exercise.

OVERVIEW (overview field): ONE paragraph, 80-110 words: who this fictional company is, its size (an invented revenue or headcount figure), what it sells, its market position, and one line of strategic context. No company-history essay.

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
