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
  // Optional context gathered on step 1. Every one of these measurably
  // sharpens generated questions and feedback, and all are skippable: an
  // empty string means "not given", never "clear what I had".
  currentRole: z.string().trim().max(160).optional(),
  cvText: z.string().max(15000).optional(),
  cvFileName: z.string().trim().max(255).optional(),
  roleSpec: z.string().max(8000).optional(),
  roleSpecFileName: z.string().trim().max(255).optional(),
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
  const {
    targetRole,
    careerStage,
    targetSector,
    biggestChallenge,
    processType,
    currentRole,
    cvText,
    cvFileName,
    roleSpec,
    roleSpecFileName,
  } = parsed.data;

  const challenge = challengeFor(biggestChallenge);

  // Deliberately NOT stamping onboardingCompletedAt here: the answers save on
  // the way into step 4, but the flow isn't finished until the equipment
  // check (step 6) hands off. Stamping early meant a mid-flow refresh
  // skipped the remaining steps entirely. Completion is PATCH's job.
  const data = {
    targetRole,
    targetSector,
    biggestChallenge,
    processType,
    onboardingSkipped: false,
    // Applied to the live defaults so the very next session differs.
    defaultExperienceLevel: careerStage,
    ...(challenge ? { defaultFocusArea: challenge.focusArea } : {}),
    // Seeds the practice screen's role field, which is otherwise blank and is
    // the one input standing between a new user and their first question.
    // A pasted job description is strictly better context than this summary,
    // so when one is supplied it leads and the summary follows it rather than
    // being overwritten by it.
    roleSpec: roleSpec?.trim()
      ? `${roleSpec.trim()}\n\n---\nTarget role: ${targetRole}\nSector: ${targetSector}\nLevel: ${careerStage}`
      : `Target role: ${targetRole}\nSector: ${targetSector}\nLevel: ${careerStage}`,
    // Only write the optional extras when given: a candidate who skips them
    // here must not have an existing profile value blanked.
    ...(currentRole?.trim() ? { currentRole: currentRole.trim() } : {}),
    ...(cvText?.trim() ? { cvText: cvText.trim() } : {}),
    ...(cvFileName?.trim() ? { cvFileName: cvFileName.trim() } : {}),
    ...(roleSpecFileName?.trim() ? { roleSpecFileName: roleSpecFileName.trim() } : {}),
  };

  await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    update: data,
    create: { clerkUserId: userId, ...data },
  });

  return NextResponse.json({ ok: true });
}

/**
 * Marks onboarding complete. Called when the equipment check (the final step)
 * hands the candidate off to their destination — completed OR skipped-check,
 * both routes go through it.
 */
export async function PATCH() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const profile = await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    update: { onboardingCompletedAt: new Date(), onboardingSkipped: false },
    create: { clerkUserId: userId, onboardingCompletedAt: new Date(), onboardingSkipped: false },
    select: {
      targetSector: true,
      defaultExperienceLevel: true,
      biggestChallenge: true,
      processType: true,
    },
  });

  recordActivity(userId, ACTIVITY_EVENTS.ONBOARDING_COMPLETED, null, {
    sector: profile.targetSector,
    stage: profile.defaultExperienceLevel,
    challenge: profile.biggestChallenge,
    processType: profile.processType,
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
