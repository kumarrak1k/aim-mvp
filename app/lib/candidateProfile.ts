/**
 * Shared helper for reading and writing candidate profiles.
 *
 * Storage: Postgres via Prisma (UserProfile table).
 *
 * Migration: on first read, if no Prisma record exists, the helper checks
 * Clerk privateMetadata and migrates existing data automatically.
 * This gives zero-downtime migration for existing users.
 */

import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { sanitizeDocumentText } from "./textSanitize";
import {
  cleanQuestionMix,
  MAX_TOTAL_QUESTIONS,
  MIN_TOTAL_QUESTIONS,
  type QuestionMix,
} from "@/app/practice/session/utils";

export type PracticeMode = "typed" | "voice" | "voice-camera";
export type SpeakerVoice = "female" | "male" | "neutral";
export type SpeakerAccent = "british" | "american" | "neutral";
export type SpeakerPace = "slow" | "natural" | "energetic";

export type SpeakerPreference = {
  voice: SpeakerVoice;
  accent: SpeakerAccent;
  pace: SpeakerPace;
};

export type CandidateProfile = {
  cvText: string;
  roleSpec: string;
  interviewGoals: string;
  cvFileName: string;
  roleSpecFileName: string;
  preferredPracticeMode: PracticeMode;
  speakerPreference: SpeakerPreference;
  defaultExperienceLevel: string;
  defaultInterviewType: string;
  defaultDifficulty: string;
  defaultFocusArea: string;
  defaultTotalQuestions: number;
  defaultUseHybridMix: boolean;
  defaultQuestionMix: QuestionMix | null;
  updatedAt: string;
};

export const DEFAULT_SPEAKER_PREFERENCE: SpeakerPreference = {
  voice: "female",
  accent: "british",
  pace: "natural",
};

export const EMPTY_PROFILE: CandidateProfile = {
  cvText: "",
  roleSpec: "",
  interviewGoals: "",
  cvFileName: "",
  roleSpecFileName: "",
  preferredPracticeMode: "typed",
  speakerPreference: DEFAULT_SPEAKER_PREFERENCE,
  defaultExperienceLevel: "Graduate / entry level",
  defaultInterviewType: "Competency / behavioural",
  defaultDifficulty: "Standard",
  defaultFocusArea: "Balanced",
  defaultTotalQuestions: 5,
  defaultUseHybridMix: false,
  defaultQuestionMix: null,
  updatedAt: "",
};

function clampTotal(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  if (rounded < MIN_TOTAL_QUESTIONS) return MIN_TOTAL_QUESTIONS;
  if (rounded > MAX_TOTAL_QUESTIONS) return MAX_TOTAL_QUESTIONS;
  return rounded;
}

const PRACTICE_MODES: PracticeMode[] = ["typed", "voice", "voice-camera"];
const SPEAKER_VOICES: SpeakerVoice[] = ["female", "male", "neutral"];
const SPEAKER_ACCENTS: SpeakerAccent[] = ["british", "american", "neutral"];
const SPEAKER_PACES: SpeakerPace[] = ["slow", "natural", "energetic"];

function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  // Sanitize on save so PDF-extraction artifacts (symbol-font glyphs, WinAnsi
  // control bytes) never persist — covers uploads, pastes, and re-saves of
  // previously garbled data.
  return sanitizeDocumentText(value.replace(/\r\n/g, "\n")).trim();
}

function cleanMode(value: unknown, fallback: PracticeMode): PracticeMode {
  if (typeof value === "string" && PRACTICE_MODES.includes(value as PracticeMode)) {
    return value as PracticeMode;
  }
  return fallback;
}

function cleanSpeaker(value: unknown, fallback: SpeakerPreference): SpeakerPreference {
  const input = value as Partial<SpeakerPreference> | undefined;
  return {
    voice: typeof input?.voice === "string" && SPEAKER_VOICES.includes(input.voice as SpeakerVoice)
      ? (input.voice as SpeakerVoice) : fallback.voice,
    accent: typeof input?.accent === "string" && SPEAKER_ACCENTS.includes(input.accent as SpeakerAccent)
      ? (input.accent as SpeakerAccent) : fallback.accent,
    pace: typeof input?.pace === "string" && SPEAKER_PACES.includes(input.pace as SpeakerPace)
      ? (input.pace as SpeakerPace) : fallback.pace,
  };
}

function rowToProfile(row: {
  cvText: string;
  roleSpec: string;
  interviewGoals: string;
  cvFileName: string;
  roleSpecFileName: string;
  preferredPracticeMode: string;
  speakerPreference: unknown;
  defaultExperienceLevel: string;
  defaultInterviewType: string;
  defaultDifficulty: string;
  defaultFocusArea: string;
  defaultTotalQuestions: number;
  defaultUseHybridMix: boolean;
  defaultQuestionMix: unknown;
  updatedAt: Date;
}): CandidateProfile {
  return {
    cvText: row.cvText,
    roleSpec: row.roleSpec,
    interviewGoals: row.interviewGoals,
    cvFileName: row.cvFileName,
    roleSpecFileName: row.roleSpecFileName,
    preferredPracticeMode: cleanMode(row.preferredPracticeMode, "typed"),
    speakerPreference: cleanSpeaker(row.speakerPreference, DEFAULT_SPEAKER_PREFERENCE),
    defaultExperienceLevel: row.defaultExperienceLevel,
    defaultInterviewType: row.defaultInterviewType,
    defaultDifficulty: row.defaultDifficulty,
    defaultFocusArea: row.defaultFocusArea,
    defaultTotalQuestions: clampTotal(row.defaultTotalQuestions, 5),
    defaultUseHybridMix: Boolean(row.defaultUseHybridMix),
    defaultQuestionMix: cleanQuestionMix(row.defaultQuestionMix) ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Try to read the legacy Clerk privateMetadata profile and return it,
 * or return an empty profile if nothing is stored.
 */
async function migrateFromClerk(clerkUserId: string): Promise<CandidateProfile> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);
    const meta = user.privateMetadata as { candidateProfile?: Partial<CandidateProfile> };
    const cp = meta?.candidateProfile;
    if (!cp || typeof cp !== "object") return EMPTY_PROFILE;

    return {
      cvText: cleanText(cp.cvText).slice(0, 15000),
      roleSpec: cleanText(cp.roleSpec).slice(0, 8000),
      interviewGoals: cleanText(cp.interviewGoals).slice(0, 2000),
      cvFileName: cleanText(cp.cvFileName).slice(0, 180),
      roleSpecFileName: cleanText(cp.roleSpecFileName).slice(0, 180),
      preferredPracticeMode: cleanMode(cp.preferredPracticeMode, "typed"),
      speakerPreference: cleanSpeaker(cp.speakerPreference, DEFAULT_SPEAKER_PREFERENCE),
      defaultExperienceLevel: cleanText(cp.defaultExperienceLevel) || "Graduate / entry level",
      defaultInterviewType: cleanText(cp.defaultInterviewType) || "Competency / behavioural",
      defaultDifficulty: cleanText(cp.defaultDifficulty) || "Standard",
      defaultFocusArea: cleanText(cp.defaultFocusArea) || "Balanced",
      defaultTotalQuestions: clampTotal(cp.defaultTotalQuestions, 5),
      defaultUseHybridMix: Boolean(cp.defaultUseHybridMix),
      defaultQuestionMix: cleanQuestionMix(cp.defaultQuestionMix) ?? null,
      updatedAt: cleanText(cp.updatedAt),
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

/**
 * Read a candidate's profile from Postgres.
 * On first access, migrates any existing data from Clerk metadata.
 */
export async function getCandidateProfile(clerkUserId: string): Promise<CandidateProfile> {
  try {
    const row = await prisma.userProfile.findUnique({ where: { clerkUserId } });

    if (row) {
      return rowToProfile(row);
    }

    // No Prisma record yet — migrate from Clerk metadata if present
    const migrated = await migrateFromClerk(clerkUserId);
    await prisma.userProfile.create({
      data: {
        clerkUserId,
        cvText: migrated.cvText,
        roleSpec: migrated.roleSpec,
        interviewGoals: migrated.interviewGoals,
        cvFileName: migrated.cvFileName,
        roleSpecFileName: migrated.roleSpecFileName,
        preferredPracticeMode: migrated.preferredPracticeMode,
        speakerPreference: migrated.speakerPreference,
        defaultExperienceLevel: migrated.defaultExperienceLevel,
        defaultInterviewType: migrated.defaultInterviewType,
        defaultDifficulty: migrated.defaultDifficulty,
        defaultFocusArea: migrated.defaultFocusArea,
        defaultTotalQuestions: migrated.defaultTotalQuestions,
        defaultUseHybridMix: migrated.defaultUseHybridMix,
        defaultQuestionMix: migrated.defaultQuestionMix ?? undefined,
      },
    });

    return migrated;
  } catch (error) {
    console.error("GET CANDIDATE PROFILE ERROR:", error);
    return EMPTY_PROFILE;
  }
}

/**
 * Write (upsert) a candidate's profile to Postgres.
 */
export async function upsertCandidateProfile(
  clerkUserId: string,
  updates: Partial<Omit<CandidateProfile, "updatedAt">>
): Promise<CandidateProfile> {
  const current = await getCandidateProfile(clerkUserId);

  const next = {
    cvText: typeof updates.cvText === "string" ? cleanText(updates.cvText).slice(0, 15000) : current.cvText,
    roleSpec: typeof updates.roleSpec === "string" ? cleanText(updates.roleSpec).slice(0, 8000) : current.roleSpec,
    interviewGoals: typeof updates.interviewGoals === "string" ? cleanText(updates.interviewGoals).slice(0, 2000) : current.interviewGoals,
    cvFileName: typeof updates.cvFileName === "string" ? cleanText(updates.cvFileName).slice(0, 180) : current.cvFileName,
    roleSpecFileName: typeof updates.roleSpecFileName === "string" ? cleanText(updates.roleSpecFileName).slice(0, 180) : current.roleSpecFileName,
    preferredPracticeMode: updates.preferredPracticeMode !== undefined ? cleanMode(updates.preferredPracticeMode, current.preferredPracticeMode) : current.preferredPracticeMode,
    speakerPreference: updates.speakerPreference !== undefined ? cleanSpeaker(updates.speakerPreference, current.speakerPreference) : current.speakerPreference,
    defaultExperienceLevel: typeof updates.defaultExperienceLevel === "string" ? (updates.defaultExperienceLevel.trim().slice(0, 90) || current.defaultExperienceLevel) : current.defaultExperienceLevel,
    defaultInterviewType: typeof updates.defaultInterviewType === "string" ? (updates.defaultInterviewType.trim().slice(0, 90) || current.defaultInterviewType) : current.defaultInterviewType,
    defaultDifficulty: typeof updates.defaultDifficulty === "string" ? (updates.defaultDifficulty.trim().slice(0, 90) || current.defaultDifficulty) : current.defaultDifficulty,
    defaultFocusArea: typeof updates.defaultFocusArea === "string" ? (updates.defaultFocusArea.trim().slice(0, 90) || current.defaultFocusArea) : current.defaultFocusArea,
    defaultTotalQuestions: updates.defaultTotalQuestions !== undefined ? clampTotal(updates.defaultTotalQuestions, current.defaultTotalQuestions) : current.defaultTotalQuestions,
    defaultUseHybridMix: typeof updates.defaultUseHybridMix === "boolean" ? updates.defaultUseHybridMix : current.defaultUseHybridMix,
    defaultQuestionMix:
      updates.defaultQuestionMix !== undefined
        ? (cleanQuestionMix(updates.defaultQuestionMix) ?? null)
        : current.defaultQuestionMix,
  };

  const { defaultQuestionMix, ...scalarNext } = next;
  const mixPersist = defaultQuestionMix ?? undefined;

  const row = await prisma.userProfile.upsert({
    where: { clerkUserId },
    create: { clerkUserId, ...scalarNext, defaultQuestionMix: mixPersist },
    update: { ...scalarNext, defaultQuestionMix: mixPersist },
  });

  return rowToProfile(row);
}

/**
 * Delete a candidate's profile from Postgres (GDPR erasure / account reset).
 */
export async function deleteCandidateProfile(clerkUserId: string): Promise<void> {
  await prisma.userProfile.deleteMany({ where: { clerkUserId } });
}
