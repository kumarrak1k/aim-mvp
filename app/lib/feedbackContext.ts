/**
 * Shared context builders for the feedback routes.
 *
 * Both /api/feedback (scoring) and /api/feedback/model-answer (the exemplar
 * answer) need the same candidate-profile / company-assessment context block,
 * so it lives here rather than being duplicated across the two routes.
 */
import type { CandidateProfile } from "@/app/lib/candidateProfile";

export type FeedbackTemplateContext = {
  customInstructions?: string;
  competencyFramework?: string;
  templateName?: string;
  companyName?: string;
};

/**
 * Replaces the personal-profile prompt block with the company's assessment
 * brief. Used only when assessmentMode is set on the request — the same
 * input that drove question generation, so feedback aligns with what was
 * asked rather than the candidate's CV.
 */
export function buildAssessmentContextBlock(
  context: FeedbackTemplateContext | undefined
): string {
  if (!context) {
    return "Company assessment context: assess this answer strictly against the role/level/type/difficulty/focus already supplied. The candidate's personal background is out of scope.";
  }

  const customInstructions = (context.customInstructions || "").trim();
  const competencyFramework = (context.competencyFramework || "").trim();
  const templateName = (context.templateName || "").trim();
  const companyName = (context.companyName || "").trim();

  return [
    `Company assessment template${templateName ? `: ${templateName}` : ""}${companyName ? ` (issued by ${companyName})` : ""}.`,
    customInstructions ? `Recruiter custom instructions:\n${customInstructions}` : "",
    competencyFramework ? `Required competency framework:\n${competencyFramework}` : "",
    "Score this answer against the company brief above and the role/level/type/difficulty/focus context. The candidate's personal CV or saved profile is NOT in scope and must not influence scoring.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildSavedProfileContext(profile: CandidateProfile) {
  const hasProfile =
    profile.cvText.trim() ||
    profile.roleSpec.trim() ||
    profile.interviewGoals.trim();

  if (!hasProfile) {
    return "No saved candidate profile has been added yet.";
  }

  return `
Saved candidate profile context:

CV / career background:
${profile.cvText || "Not provided."}

Target role specification:
${profile.roleSpec || "Not provided."}

Candidate interview goals:
${profile.interviewGoals || "Not provided."}

Uploaded CV file:
${profile.cvFileName || "Not provided."}

Uploaded role spec file:
${profile.roleSpecFileName || "Not provided."}

Profile last updated:
${profile.updatedAt || "Unknown."}
`.trim();
}
