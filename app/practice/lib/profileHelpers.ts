import type { CandidateProfile } from "../types";

export const hasCandidateProfileContext = (
  profile: CandidateProfile | null
) => {
  return Boolean(
    profile?.cvText?.trim() ||
      profile?.roleSpec?.trim() ||
      profile?.interviewGoals?.trim()
  );
};

export const getFirstUsefulProfileLine = (text: string) => {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .find(Boolean)
    ?.slice(0, 160);
};

export const buildAutofilledRoleFromProfile = (
  profile: CandidateProfile | null
) => {
  if (!profile || !hasCandidateProfileContext(profile)) return "";

  const roleLine =
    getFirstUsefulProfileLine(profile.roleSpec) ||
    getFirstUsefulProfileLine(profile.interviewGoals) ||
    getFirstUsefulProfileLine(profile.cvText);

  if (roleLine) {
    return `Saved profile: ${roleLine}`;
  }

  return "Saved candidate profile";
};

export const buildCandidateProfilePrompt = ({
  role,
  experienceLevel,
  interviewType,
  difficulty,
  focusArea,
}: {
  role: string;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  focusArea: string;
}) => {
  return `
Target role/profile:
${role.trim()}

Experience level:
${experienceLevel}

Interview type:
${interviewType}

Difficulty:
${difficulty}

Main practice focus:
${focusArea}

Instruction:
Generate questions and feedback that match this candidate context. Use the selected difficulty and focus area when deciding how strict, detailed and challenging to be.
`.trim();
};
