export type CandidateProfile = {
  cvText: string;
  roleSpec: string;
  interviewGoals: string;
  cvFileName: string;
  roleSpecFileName: string;
  updatedAt: string;
};

export type ProfileUploadTarget = "cv" | "roleSpec";