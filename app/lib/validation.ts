/**
 * Shared Zod validation schemas and constants.
 *
 * Used by API routes to validate request bodies in a consistent, type-safe way.
 * Each schema includes sensible defaults so a missing optional field doesn't
 * blow up the route — it just falls back to the default value.
 */

import { z } from "zod";

// ─── Shared enums ─────────────────────────────────────────────────────────────

export const EXPERIENCE_LEVELS = [
  "Graduate / entry level",
  "Junior (1-3 years)",
  "Mid-level (3-5 years)",
  "Senior (5-8 years)",
  "Lead / Principal (8+ years)",
] as const;

export const INTERVIEW_TYPES = [
  "Competency / behavioural",
  "Technical / skills-based",
  "Situational / case study",
  "Values / culture fit",
  "Mixed / general",
] as const;

export const DIFFICULTIES = ["Standard", "Challenging", "Executive"] as const;

export const FOCUS_AREAS = [
  "Balanced",
  "Communication",
  "Problem solving",
  "Leadership",
  "Technical depth",
  "Stakeholder management",
] as const;

export const PRACTICE_MODES = ["typed", "voice", "voice-camera"] as const;

export const HIRE_SIGNALS = ["Weak", "Moderate", "Strong"] as const;

// ─── Reusable primitives ──────────────────────────────────────────────────────

/** Trimmed non-empty string with hard length cap. */
export const cleanStringSchema = (max: number, label = "Field") =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

/** Optional trimmed string capped at `max`. Empty/undefined → undefined. */
export const optionalStringSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

/** Lowercased email with basic sanity check. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address.");

/** A CUID-ish id field — accept anything 6–60 chars of url-safe text. */
export const idSchema = z
  .string()
  .trim()
  .min(6)
  .max(60)
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid id format.");

// ─── Composite schemas (used in multiple routes) ──────────────────────────────

/** Practice session POST body — what the client sends after a full session. */
// SALVAGE, don't reject: this schema records an interview the candidate has
// already COMPLETED (time + AI cost spent). The interview-generation route
// accepts arbitrarily long role text, so a strict cap here silently threw
// away finished sessions (role > 120 chars → 400 → nothing on My Progress).
// Out-of-range field values fall back to defaults; long text is truncated.
export const practiceSessionCreateSchema = z.object({
  role: z
    .string()
    .trim()
    .min(1, "Role is required.")
    .max(8000, "Role is too long.")
    .transform((v) => v.slice(0, 300)),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).catch("Graduate / entry level"),
  interviewType: z.enum(INTERVIEW_TYPES).catch("Competency / behavioural"),
  difficulty: z.enum(DIFFICULTIES).catch("Standard"),
  focusArea: z.enum(FOCUS_AREAS).catch("Balanced"),
  practiceMode: z.enum(PRACTICE_MODES).catch("typed"),
  totalQuestions: z.number().int().min(1).max(20).catch(5),
  // The summary and results blobs are user-generated content from the client.
  // We accept any object shape here but strictly cap nesting / size at the
  // request body level by limiting overall payload size in `extractBody`.
  summary: z.record(z.string(), z.unknown()),
  results: z.array(z.unknown()).max(50),
  speakerPreference: z
    .object({
      voice: z.string().max(20).optional(),
      accent: z.string().max(20).optional(),
      pace: z.string().max(20).optional(),
    })
    .nullable()
    .optional(),
  assignmentToken: optionalStringSchema(80),
});

/** Company create / update body. */
export const companyCreateSchema = z.object({
  name: cleanStringSchema(120, "Company name"),
  industry: optionalStringSchema(120),
});

export const companyUpdateSchema = z.object({
  name: optionalStringSchema(120),
  industry: optionalStringSchema(120),
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Brand colour must be a #rrggbb hex value.")
    .optional(),
});

export const companyDeleteSchema = z.object({
  confirmName: cleanStringSchema(120, "Confirmation name"),
});

// ─── Question mix (for advanced question type control) ────────────────────────

export const QUESTION_MIX_KEYS = [
  "opener",
  "competency",
  "technical",
  "leadership",
  "motivation",
  "situational",
  "commercial",
  "custom",
] as const;

export type QuestionMixKey = (typeof QUESTION_MIX_KEYS)[number];

/** Partial record — each key is an optional non-negative integer count. */
export const questionMixSchema = z
  .record(z.enum(QUESTION_MIX_KEYS), z.number().int().min(0).max(10))
  .optional();

// ─── AC stages ────────────────────────────────────────────────────────────────

export const AC_STAGES = ["stage1", "stage2", "stage3"] as const;
export type AcStage = (typeof AC_STAGES)[number];

/** Assessment template — POST and PATCH share the same shape, with PATCH
 *  marking everything optional so partial updates work. */
const templateBaseSchema = z.object({
  name: cleanStringSchema(120, "Template name"),
  description: optionalStringSchema(5000),
  role: cleanStringSchema(120, "Role"),
  // templateType: "interview" (default) | "assessment-centre"
  templateType: z.enum(["interview", "assessment-centre"]).default("interview"),
  // AC-only: which stages to include
  acStages: z.array(z.enum(AC_STAGES)).max(3).optional(),
  // Optional question mix — overrides interviewType-based defaults
  questionMix: questionMixSchema,
  experienceLevel: z.enum(EXPERIENCE_LEVELS).default("Graduate / entry level"),
  interviewType: z.enum(INTERVIEW_TYPES).default("Competency / behavioural"),
  difficulty: z.enum(DIFFICULTIES).default("Standard"),
  focusArea: z.enum(FOCUS_AREAS).default("Balanced"),
  questionCount: z.number().int().min(1).max(10).default(5),
  customInstructions: optionalStringSchema(2000),
  competencyFramework: optionalStringSchema(2000),
  // Verbatim text for each "custom" slot in questionMix, in order.
  // Max 10 slots × 500 chars each.
  customQuestions: z
    .array(z.string().trim().max(500))
    .max(10)
    .optional()
    .transform((arr) =>
      arr && arr.length > 0
        ? arr.map((q) => q.trim()).filter((q) => q.length > 0)
        : undefined
    ),
});

export const templateCreateSchema = templateBaseSchema;
export const templateUpdateSchema = templateBaseSchema.partial().extend({
  isActive: z.boolean().optional(),
});

/** Assignment creation body. */
export const assignmentCreateSchema = z.object({
  candidateEmail: emailSchema,
  templateId: idSchema,
  expiryDays: z.number().int().min(1).max(30).default(7),
});

/** Assessment-completion POST body. */
export const assessmentCompleteSchema = z.object({
  sessionId: idSchema,
});

// ─── Helper: parse + return a JSON error response on failure ─────────────────

import { NextResponse } from "next/server";

/**
 * Parse JSON body against a Zod schema. On success returns `{ data }`.
 * On failure returns `{ response }` — a 400 NextResponse the route can return
 * directly, with a clear summary of which fields failed.
 *
 * Usage:
 *   const parsed = await parseJsonBody(request, mySchema);
 *   if ("response" in parsed) return parsed.response;
 *   const { data } = parsed;
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ data: T } | { response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      response: NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    // Surface up to 3 issues so the client gets actionable detail without
    // leaking schema internals.
    const issues = result.error.issues.slice(0, 3).map((issue) => {
      const path = issue.path.join(".") || "(root)";
      return `${path}: ${issue.message}`;
    });
    return {
      response: NextResponse.json(
        {
          error: "Invalid request.",
          details: issues,
        },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}
