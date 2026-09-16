/**
 * What the platform costs to run, metered as we spend it.
 *
 * Every provider bills differently and none of them tells us in one place.
 * Rakesh asks two questions: how much is this month running at, and how close
 * is a prepaid allowance to running out. Both are answered from rows we write
 * ourselves as each paid call happens, so nothing depends on a provider
 * exposing a usage API we may not have permission to read.
 */

import { prisma } from "@/app/lib/prisma";

export type UsageProvider = "elevenlabs" | "openai" | "whisper";
export type UsageUnit = "characters" | "credits" | "tokens" | "seconds";

/** Monthly credit allowance by ElevenLabs plan, as published on their pricing. */
export const ELEVENLABS_PLANS: Record<string, number> = {
  free: 10_000,
  starter: 30_000,
  creator: 121_000,
  pro: 600_000,
  scale: 1_800_000,
};

/** Monthly fee in pence, for turning credits into a believable cost. */
const ELEVENLABS_PLAN_PENCE: Record<string, number> = {
  free: 0,
  starter: 480, // $6
  creator: 1_760, // $22
  pro: 7_920, // $99
  scale: 23_920, // $299
};

/**
 * Thresholds on the remaining allowance. A fifth left is about a week's notice
 * at a steady rate; a twentieth means act today. Warning must come first.
 */
export const LOW_CREDIT_WARNING = 0.2;
export const LOW_CREDIT_CRITICAL = 0.05;

export type AllowanceState = "ok" | "low" | "critical" | "exhausted";

function planName(): string {
  return (process.env.ELEVENLABS_PLAN || "free").toLowerCase();
}

/** OpenAI speech, roughly: $0.015 per minute, and a minute is ~900 characters. */
const OPENAI_PENCE_PER_CHARACTER = 0.0013;

/**
 * What one call cost, in pence.
 *
 * ElevenLabs is prepaid, so a credit's cost is the plan fee divided by the
 * plan's allowance: spending the whole month's credits costs the whole month's
 * fee, which is the only honest way to attribute it. An unknown provider
 * returns zero rather than inventing a number.
 */
export function estimateCostPence(input: {
  provider: string;
  credits?: number;
  units?: number;
  unitType?: UsageUnit;
  plan?: string;
}): number {
  if (input.provider === "elevenlabs") {
    const plan = (input.plan || planName()).toLowerCase();
    const allowance = ELEVENLABS_PLANS[plan] ?? ELEVENLABS_PLANS.free;
    const fee = ELEVENLABS_PLAN_PENCE[plan] ?? 0;
    if (!input.credits || allowance === 0) return 0;
    return (input.credits / allowance) * fee;
  }

  if (input.provider === "openai" && input.unitType === "characters") {
    return (input.units ?? 0) * OPENAI_PENCE_PER_CHARACTER;
  }

  return 0;
}

export function creditsRemaining(input: { plan?: string; creditsUsed: number }): number {
  const allowance = ELEVENLABS_PLANS[(input.plan || planName()).toLowerCase()] ?? ELEVENLABS_PLANS.free;
  return Math.max(0, allowance - Math.round(input.creditsUsed));
}

export function allowanceState(input: { plan?: string; creditsUsed: number }): AllowanceState {
  const plan = (input.plan || planName()).toLowerCase();
  const allowance = ELEVENLABS_PLANS[plan] ?? ELEVENLABS_PLANS.free;
  if (allowance === 0) return "exhausted";

  const left = creditsRemaining({ plan, creditsUsed: input.creditsUsed }) / allowance;
  if (left <= 0) return "exhausted";
  if (left < LOW_CREDIT_CRITICAL) return "critical";
  if (left < LOW_CREDIT_WARNING) return "low";
  return "ok";
}

/**
 * Record one paid call. Never throws: metering must not be able to break the
 * thing it is measuring.
 */
export async function recordServiceUsage(input: {
  provider: UsageProvider;
  operation: string;
  units?: number;
  unitType: UsageUnit;
  credits?: number;
}): Promise<void> {
  try {
    await prisma.serviceUsage.create({
      data: {
        provider: input.provider,
        operation: input.operation,
        units: Math.round(input.units ?? 0),
        unitType: input.unitType,
        credits: Math.round(input.credits ?? 0),
        costPence: estimateCostPence({
          provider: input.provider,
          credits: input.credits,
          units: input.units,
          unitType: input.unitType,
        }),
      },
    });
  } catch (error) {
    console.error("SERVICE USAGE RECORD FAILED:", error);
  }
}

export type ProviderTotals = {
  provider: string;
  operations: number;
  units: number;
  credits: number;
  costPence: number;
};

/** The first of the current month, which is when every allowance resets. */
export function startOfBillingMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Month-to-date totals per provider, newest month only. */
export async function usageThisMonth(now = new Date()): Promise<ProviderTotals[]> {
  const since = startOfBillingMonth(now);

  const rows = await prisma.serviceUsage.groupBy({
    by: ["provider"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    _sum: { units: true, credits: true, costPence: true },
  });

  return rows
    .map((row) => ({
      provider: row.provider,
      operations: row._count._all,
      units: row._sum.units ?? 0,
      credits: row._sum.credits ?? 0,
      costPence: row._sum.costPence ?? 0,
    }))
    .sort((a, b) => b.costPence - a.costPence);
}

/** Credits spent with ElevenLabs since the allowance last reset. */
export async function elevenLabsCreditsUsed(now = new Date()): Promise<number> {
  const result = await prisma.serviceUsage.aggregate({
    where: { provider: "elevenlabs", createdAt: { gte: startOfBillingMonth(now) } },
    _sum: { credits: true },
  });

  return result._sum.credits ?? 0;
}
