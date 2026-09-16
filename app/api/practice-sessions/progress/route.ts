import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { parseJsonBody, practiceProgressSchema } from "@/app/lib/validation";
import {
  getCandidatePlan,
  TRIAL_USAGE_CAPS,
  FREE_TIER,
} from "@/app/lib/candidatePlan";
import { PRACTICE_SESSION_STATUS, USAGE_COUNT_FILTER } from "@/app/lib/practiceSessionStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PUT /api/practice-sessions/progress
 *
 * Saves an interview while it is still happening: one row per attempt, written
 * again after every scored answer. Before this, a session only existed once
 * every question was answered, so anyone who left part way lost their work and
 * looked like they had never practised.
 *
 * Company assessments are excluded on purpose: those results belong to the
 * hiring team and only count when the whole interview is completed.
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to save your progress." },
        { status: 401 }
      );
    }

    const parsed = await parseJsonBody(request, practiceProgressSchema);
    if ("response" in parsed) return parsed.response;

    const {
      attemptId,
      role,
      experienceLevel,
      interviewType,
      difficulty,
      focusArea,
      practiceMode,
      totalQuestions,
      results,
      speakerPreference,
      config,
    } = parsed.data;

    const cfg = (config ?? {}) as Record<string, unknown>;
    if (cfg.assessmentMode || cfg.assignmentToken || cfg.assessmentCentreId) {
      return NextResponse.json(
        { error: "Assessment interviews are not saved part way." },
        { status: 400 }
      );
    }

    const answeredCount = results.length;

    const existing = await prisma.practiceSession.findFirst({
      where: { clerkUserId: userId, attemptId },
      select: { id: true, status: true, answeredCount: true },
    });

    if (existing) {
      if (existing.status !== PRACTICE_SESSION_STATUS.IN_PROGRESS) {
        return NextResponse.json(
          { error: "This interview has already finished.", status: existing.status },
          { status: 409 }
        );
      }
      // Answers only ever grow. Two tabs sharing an attempt id (duplicating a
      // tab copies sessionStorage) must not let the one behind overwrite the
      // one ahead.
      if (answeredCount < existing.answeredCount) {
        return NextResponse.json(
          {
            error: "This interview has been continued somewhere else.",
            answeredCount: existing.answeredCount,
          },
          { status: 409 }
        );
      }

      const updated = await prisma.practiceSession.update({
        where: { id: existing.id },
        data: {
          role,
          experienceLevel,
          interviewType,
          difficulty,
          focusArea,
          practiceMode,
          totalQuestions,
          results: results as Prisma.InputJsonValue,
          answeredCount,
          speakerPreference: (speakerPreference ?? null) as Prisma.InputJsonValue,
          config: (config ?? null) as Prisma.InputJsonValue,
          lastActivityAt: new Date(),
        },
        select: { id: true, answeredCount: true, status: true },
      });

      return NextResponse.json({ session: updated });
    }

    // First answer of a new interview: this is where the plan cap applies, so
    // an out-of-allowance user is told now rather than after the whole thing.
    const plan = await getCandidatePlan(userId);
    if (!plan.isUnlimited) {
      const cap = plan.isTrial
        ? TRIAL_USAGE_CAPS.practiceSessions
        : FREE_TIER.practiceSessionsPerWindow;
      const since = plan.isTrial
        ? plan.trialStartedAt
          ? new Date(plan.trialStartedAt)
          : undefined
        : new Date(Date.now() - FREE_TIER.windowDays * 24 * 60 * 60 * 1000);
      const used = await prisma.practiceSession.count({
        where: {
          clerkUserId: userId,
          ...USAGE_COUNT_FILTER,
          ...(since && { createdAt: { gte: since } }),
        },
      });
      if (used >= cap) {
        return NextResponse.json(
          {
            error: plan.isTrial
              ? `You've reached your free-trial fair-use limit of ${cap} practice interviews.`
              : `You've used all ${cap} free interviews for this month.`,
          },
          { status: 429 }
        );
      }
    }

    const created = await prisma.practiceSession.create({
      data: {
        clerkUserId: userId,
        attemptId,
        role,
        experienceLevel,
        interviewType,
        difficulty,
        focusArea,
        practiceMode,
        totalQuestions,
        status: PRACTICE_SESSION_STATUS.IN_PROGRESS,
        answeredCount,
        results: results as Prisma.InputJsonValue,
        summary: {} as Prisma.InputJsonValue,
        speakerPreference: (speakerPreference ?? null) as Prisma.InputJsonValue,
        config: (config ?? null) as Prisma.InputJsonValue,
        lastActivityAt: new Date(),
      },
      select: { id: true, answeredCount: true, status: true },
    });

    return NextResponse.json({ session: created });
  } catch (error) {
    console.error("PRACTICE SESSION PROGRESS ERROR:", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Could not save your progress." }, { status: 500 });
  }
}
