/**
 * The question bank: what a practice session actually asks.
 *
 * Until now every question was written fresh by the model from a type
 * instruction. Each one was plausible and none was standard, so a candidate
 * who practised here met a different set of questions in the real thing. The
 * bank holds the questions employers really ask; the model is kept for the one
 * question per session that should come from the candidate's own CV, and for
 * whenever the bank runs dry.
 */

import { CORE_QUESTIONS } from "./core";
import { SECTOR_QUESTIONS } from "./sectors";
import {
  BANK_COMPETENCIES,
  BANK_TYPES,
  type BankCompetency,
  type BankLevel,
  type BankQuestion,
  type BankSector,
  type BankType,
} from "./types";

export {
  BANK_COMPETENCIES,
  BANK_TYPES,
  type BankCompetency,
  type BankLevel,
  type BankQuestion,
  type BankSector,
  type BankType,
};

export const QUESTION_BANK: readonly BankQuestion[] = [...CORE_QUESTIONS, ...SECTOR_QUESTIONS];

/** The slot in a session blueprint that the model writes from the CV. */
export const TAILORED = "tailored" as const;

export type BlueprintSlot = BankType | typeof TAILORED;

/** Comparing questions by meaning rather than by punctuation and capitals. */
function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * The seven levels the setup screen offers collapse to the three the bank
 * tags. Anything unrecognised becomes "graduate", which fits the most people
 * and is never unfair to ask.
 */
export function levelFromExperience(experienceLevel: string | undefined | null): BankLevel {
  const value = (experienceLevel ?? "").toLowerCase();
  if (value.includes("student") || value.includes("early career")) return "early";
  // One to three years is still early enough that a question about running a
  // team would be unfair, so only three years and up counts as experienced.
  if (value.includes("senior") || value.includes("experienced") || /3\s*[–-]\s*7/.test(value)) {
    return "experienced";
  }
  return "graduate";
}

/**
 * Everything in the bank that fits. Sector questions are a LAYER: a sector
 * filter adds the questions written for that sector and keeps every untagged
 * one, so a narrow sector can never empty the pool.
 */
export function questionsFor(filter: {
  type: BankType;
  sector?: string;
  level?: BankLevel;
}): BankQuestion[] {
  return QUESTION_BANK.filter((question) => {
    if (question.type !== filter.type) return false;
    if (question.sectors && question.sectors.length > 0) {
      if (!filter.sector || !question.sectors.includes(filter.sector as BankSector)) return false;
    }
    if (question.levels && filter.level && !question.levels.includes(filter.level)) return false;
    return true;
  });
}

/** A small, stable hash so one attempt always picks the same way. */
function hash(seed: string): number {
  let value = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    value ^= seed.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}

/**
 * One question of a given type, or null when the bank has nothing left to
 * offer — at which point the caller falls back to the model rather than
 * repeating itself.
 */
export function pickQuestion(options: {
  type: BankType;
  /** Questions already put to this candidate, in this session and recently. */
  asked: string[];
  /** Competencies already covered, so a session is not three teamwork questions. */
  usedCompetencies?: string[];
  sector?: string;
  level?: BankLevel;
  /** The attempt id: stable within a session, different for the next one. */
  seed: string;
}): BankQuestion | null {
  const askedTexts = new Set(options.asked.map(normalise));
  const available = questionsFor(options).filter((q) => !askedTexts.has(normalise(q.text)));
  if (available.length === 0) return null;

  // Prefer ground this session has not covered yet; fall back to the whole
  // pool rather than giving up when every competency has come up.
  const used = new Set(options.usedCompetencies ?? []);
  const fresh = available.filter((q) => !q.competency || !used.has(q.competency));
  const pool = fresh.length > 0 ? fresh : available;

  return pool[hash(`${options.seed}:${options.type}:${used.size}`) % pool.length];
}

/**
 * The shape of a session, mirroring a real graduate screen: an opener, why us,
 * competency in the middle with something situational or strengths-based
 * mixed in, and one question written from the candidate's own CV. Commercial
 * awareness only appears when there is room for it.
 */
export function sessionBlueprint(totalQuestions: number): BlueprintSlot[] {
  const total = Math.max(1, Math.floor(totalQuestions));

  // The full shape, in the order a real screen tends to use. A shorter session
  // is the front of this list, which is why the opener, motivation and the
  // tailored question come first.
  const shape: BlueprintSlot[] = [
    "opener",
    "motivation",
    "competency",
    TAILORED,
    "competency",
    "situational",
    "competency",
    "commercial",
    "strengths",
    "competency",
  ];

  if (total <= shape.length) {
    const trimmed = shape.slice(0, total);
    // The tailored question is the point of the exercise, so a very short
    // session keeps it rather than letting the trim cut it off.
    if (!trimmed.includes(TAILORED)) trimmed[trimmed.length - 1] = TAILORED;
    return trimmed;
  }

  const extra: BlueprintSlot[] = Array.from({ length: total - shape.length }, (_, i) =>
    i % 2 === 0 ? "competency" : "situational"
  );
  return [...shape, ...extra];
}

/**
 * Which slot question N is.
 *
 * A mix somebody chose deliberately — a Pro user's custom mix, or a
 * recruiter's template — always wins over our blueprint. Null means the bank
 * should not answer at all: either the slot is the candidate's own verbatim
 * question, or the mix has run out and the model should write something.
 */
export function slotForQuestion(options: {
  questionNumber: number;
  totalQuestions: number;
  questionMix?: Partial<Record<string, number>> | null;
}): BlueprintSlot | null {
  const mix = options.questionMix;
  const mixTotal = mix
    ? Object.values(mix).reduce<number>((sum, count) => sum + (typeof count === "number" ? count : 0), 0)
    : 0;

  if (!mix || mixTotal === 0) {
    const shape = sessionBlueprint(options.totalQuestions);
    return shape[options.questionNumber - 1] ?? null;
  }

  // The mix is flattened in the same order the setup screen shows it, which is
  // how the client already decides where a verbatim question belongs.
  const MIX_ORDER = [
    "opener",
    "competency",
    "technical",
    "leadership",
    "motivation",
    "situational",
    "commercial",
    "custom",
  ] as const;

  let position = 0;
  for (const key of MIX_ORDER) {
    const count = mix[key] ?? 0;
    if (options.questionNumber <= position + count) {
      // A custom slot holds the recruiter's own words: never ours.
      return key === "custom" ? null : (key as BlueprintSlot);
    }
    position += count;
  }

  return null;
}

/** Which competencies a set of already-asked questions covered. */
export function competenciesAsked(asked: string[]): BankCompetency[] {
  const askedTexts = new Set(asked.map(normalise));
  const found = new Set<BankCompetency>();

  for (const question of QUESTION_BANK) {
    if (question.competency && askedTexts.has(normalise(question.text))) {
      found.add(question.competency);
    }
  }

  return [...found];
}
