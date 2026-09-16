/**
 * The shape of a banked interview question.
 *
 * Every question here is written by us from the patterns employers actually
 * use, or taken from material we are licensed to reuse. Nothing is scraped
 * from a job board or copied from a curated list, and nothing claims to be a
 * real question from a named employer.
 */

import { SECTORS } from "@/app/lib/onboarding";

export type BankSector = (typeof SECTORS)[number];

/**
 * The same vocabulary the question mix uses, minus "custom" (a recruiter's own
 * verbatim question, which never comes from the bank) and plus "strengths",
 * which the big graduate schemes lean on heavily.
 */
export const BANK_TYPES = [
  "opener",
  "motivation",
  "competency",
  "strengths",
  "situational",
  "commercial",
  "technical",
  "leadership",
] as const;

export type BankType = (typeof BANK_TYPES)[number];

/**
 * What a competency question is actually about. Without this a session asks
 * about teamwork three times and calls itself varied.
 */
export const BANK_COMPETENCIES = [
  "teamwork",
  "resilience",
  "conflict",
  "failure",
  "problem-solving",
  "communication",
  "organisation",
  "initiative",
  "adaptability",
  "ethics",
  "customer-focus",
  "learning",
] as const;

export type BankCompetency = (typeof BANK_COMPETENCIES)[number];

/**
 * Three levels rather than the seven the setup screen offers: the finer
 * distinctions matter to the coaching, not to whether a question is fair to
 * ask. A question about running a team is wrong for a school leaver and fine
 * for everyone else.
 */
export type BankLevel = "early" | "graduate" | "experienced";

/**
 * Where in an interview a question belongs.
 *
 * A real interview opens, explores, then closes. "What would make you turn
 * down an offer from us?" is a question asked once there is an offer in sight,
 * and putting it second makes the whole thing feel wrong — which is exactly
 * what happened live. Most questions work anywhere and leave this unset.
 */
export type BankStage = "opening" | "middle" | "closing";

export type BankSource =
  /** Written by us from common patterns. */
  | "original"
  /** Civil Service Success Profiles, Open Government Licence v3, attributed. */
  | "ogl-success-profiles";

export type BankQuestion = {
  /** Stable id, so an asked question can be recorded without its text. */
  id: string;
  text: string;
  type: BankType;
  /** Required for competency questions, meaningless for the rest. */
  competency?: BankCompetency;
  /** Omitted means the question suits any sector. */
  sectors?: BankSector[];
  /** Omitted means the question suits any level. */
  levels?: BankLevel[];
  /** Omitted means the question can be asked at any point. */
  stage?: BankStage;
  source: BankSource;
};
