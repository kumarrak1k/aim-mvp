import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { parseJsonBody } from "@/app/lib/validation";
import { recordActivity, ACTIVITY_EVENTS } from "@/app/lib/activity";
import {
  CAREER_STAGES,
  SECTORS,
  CHALLENGES,
  PROCESS_TYPES,
  challengeFor,
} from "@/app/lib/onboarding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stageValues = CAREER_STAGES.map((s) => s.value) as [string, ...string[]];
const sectorValues = [...SECTORS] as [string, ...string[]];
const challengeValues = CHALLENGES.map((c) => c.value) as [string, ...string[]];
const processValues = PROCESS_TYPES.map((p) => p.value) as [string, ...string[]];

const bodySchema = z.object({
  targetRole: z.string().trim().min(1).max(160),
  careerStage: z.enum(stageValues),
  targetSector: z.enum(sectorValues),
  biggestChallenge: z.enum(challengeValues),
  processType: z.enum(processValues),
});

/**
 * Saves the onboarding answers.
 *
 * The answers are written into the fields the product ALREADY reads —
 * defaultExperienceLevel and defaultFocusArea — as well as being stored raw.
 * If they only lived in new columns nothing would behave differently, the
 * candidate would notice, and the flow would become the thing it is meant to
 * replace: questions asked for no visible reason.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if ("response" in parsed) return parsed.response;
  const { targetRole, careerStage, targetSector, biggestChallenge, processType } =
    parsed.data;

  const challenge = challengeFor(biggestChallenge);

  const data = {
    targetRole,
    targetSector,
    biggestChallenge,
    processType,
    onboardingCompletedAt: new Date(),
    onboardingSkipped: false,
    // Applied to the live defaults so the very next session differs.
    defaultExperienceLevel: careerStage,
    ...(challenge ? { defaultFocusArea: challenge.focusArea } : {}),
    // Seeds the practice screen's role field, which is otherwise blank and is
    // the one input standing between a new user and their first question.
    roleSpec: `Target role: ${targetRole}\nSector: ${targetSector}\nLevel: ${careerStage}`,
  };

  await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    update: data,
    create: { clerkUserId: userId, ...data },
  });

  recordActivity(userId, ACTIVITY_EVENTS.ONBOARDING_COMPLETED, null, {
    sector: targetSector,
    stage: careerStage,
    challenge: biggestChallenge,
    processType,
  });

  return NextResponse.json({ ok: true });
}

/**
 * Skipping is recorded rather than ignored. A high skip rate means the flow is
 * the problem; silently treating a skip as "not started" would hide that.
 */
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    update: { onboardingSkipped: true, onboardingCompletedAt: new Date() },
    create: { clerkUserId: userId, onboardingSkipped: true, onboardingCompletedAt: new Date() },
  });

  recordActivity(userId, ACTIVITY_EVENTS.ONBOARDING_SKIPPED, null, {});

  return NextResponse.json({ ok: true });
}
