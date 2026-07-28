/**
 * POST /api/assessment/[token]/start-ac
 *
 * Creates an AssessmentCentreSession from a company invite that uses an
 * "assessment-centre" template.  Unlike the candidate self-serve start route
 * this does NOT require the Advanced plan — the company's plan is used instead.
 *
 * Idempotent: if the assignment already has an acSessionId we return the
 * existing session so a browser refresh doesn't create a duplicate.
 */

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { callOpenAIChat } from "@/app/lib/openai-client";
import { MODEL_PREMIUM } from "@/app/lib/aiModels";
import { buildCaseStudyPrompts, buildPresentationBriefPrompts } from "@/app/lib/assessmentCentrePrompts";
import { checkRateLimit } from "@/app/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 180;
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

function isValidTokenFormat(token: string): boolean {
  return /^[a-zA-Z0-9_-]{8,80}$/.test(token);
}

function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { token } = await params;
    if (!isValidTokenFormat(token)) {
      return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
    }

    // Rate limit: cap AC starts per user per hour (generous — per-token idempotency handles the real protection)
    const rl = await checkRateLimit(userId, "assessment-centre-start", 10, 3600);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit reached. Try again in ${rl.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    // Load the assignment + template
    const assignment = await prisma.candidateAssignment.findUnique({
      where: { inviteToken: token },
      include: {
        template: true,
        company: { select: { name: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
    }
    if (assignment.expiresAt < new Date()) {
      return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
    }
    if (assignment.status === "completed") {
      return NextResponse.json({ error: "This assessment has already been completed." }, { status: 409 });
    }

    const template = assignment.template;
    if (template.templateType !== "assessment-centre") {
      return NextResponse.json({ error: "This invite is for an interview, not an assessment centre." }, { status: 400 });
    }

    // Idempotency: return existing session if already started
    if (assignment.acSessionId) {
      const existing = await prisma.assessmentCentreSession.findUnique({
        where: { id: assignment.acSessionId },
      });
      if (existing) {
        return NextResponse.json({ sessionId: existing.id, initialStage: existing.currentStage });
      }
    }

    const selectedStages = (template.acStages as string[]).length > 0
      ? (template.acStages as Array<"stage1" | "stage2" | "stage3">)
      : ["stage1", "stage2", "stage3"] as const;

    const hasStage1 = selectedStages.includes("stage1");
    const hasStage2 = selectedStages.includes("stage2");
    const hasStage3 = selectedStages.includes("stage3");
    const initialStatus = hasStage1 ? "stage1" : hasStage2 ? "stage2" : "stage3";
    const initialStageNum = hasStage1 ? 1 : hasStage2 ? 2 : 3;

    // Build templateConfig for stage-2 interview so that stage uses the
    // template's interview settings rather than hardcoded defaults.
    const templateConfig = {
      interviewType: template.interviewType,
      difficulty: template.difficulty,
      focusArea: template.focusArea,
      questionCount: template.questionCount,
      questionMix: template.questionMix ?? null,
      customInstructions: template.customInstructions ?? null,
      competencyFramework: template.competencyFramework ?? null,
    };

    // Generate case study scenario if stage1 is included
    let scenario: unknown = null;
    let presentationBrief: unknown = null;

    // When stage3 is the only selected stage, generate the brief now — there is
    // no submit-case-study or submit-interview call to generate it later.
    if (!hasStage1 && !hasStage2 && hasStage3) {
      // Corporate invites carry no sector, so the company name stands in as the
      // organisational context (matching the case-study call below). The prompt's
      // fictional-company guard stops that name becoming the subject of the brief.
      const { systemPrompt: briefSystemPrompt, userPrompt: briefUserPrompt } =
        buildPresentationBriefPrompts({
          role: template.role,
          sector: assignment.company.name,
        });

      const briefResponse = await callOpenAIChat(
        {
          model: MODEL_PREMIUM,
          messages: [
            { role: "system", content: briefSystemPrompt },
            { role: "user", content: briefUserPrompt },
          ],
          temperature: 0.8,
          max_tokens: 800,
        },
        { timeoutMs: 45000 }
      );

      const rawBrief = stripMarkdownFences(briefResponse.choices[0].message.content);
      try {
        presentationBrief = JSON.parse(rawBrief);
      } catch {
        presentationBrief = { topic: "Strategic market expansion", audience: "Senior leadership team", context: "The company is evaluating growth opportunities.", format: "3-minute spoken presentation", objectives: ["Present a clear recommendation", "Back it with evidence", "Outline key risks"], timeMinutes: 3 };
      }
    }

    if (hasStage1) {
      const { systemPrompt, userPrompt } = buildCaseStudyPrompts({
        role: template.role,
        // Company invites carry no sector — the company name stands in as the
        // organisational context (same proxy the session record uses below).
        sector: assignment.company.name,
        experienceLevel: template.experienceLevel,
      });

      const aiResponse = await callOpenAIChat(
        {
          model: MODEL_PREMIUM,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        },
        { timeoutMs: 90000 }
      );

      const raw = stripMarkdownFences(aiResponse.choices[0].message.content);
      try {
        scenario = JSON.parse(raw);
      } catch {
        return NextResponse.json({ error: "Failed to parse scenario from AI." }, { status: 500 });
      }
    }

    // Create the AC session
    const session = await prisma.assessmentCentreSession.create({
      data: {
        clerkUserId: userId,
        assignmentToken: token,
        templateConfig: templateConfig as object,
        role: template.role,
        sector: assignment.company.name, // use company name as sector proxy for company invites
        experienceLevel: template.experienceLevel,
        selectedStages: selectedStages as string[],
        status: initialStatus,
        currentStage: initialStageNum,
        ...(scenario ? { caseStudyScenario: scenario as object } : {}),
        ...(presentationBrief ? { presentationBrief: presentationBrief as object } : {}),
      },
    });

    // Link the session back to the assignment and mark as started
    await prisma.candidateAssignment.update({
      where: { inviteToken: token },
      data: {
        acSessionId: session.id,
        clerkUserId: userId,
        status: "started",
        startedAt: new Date(),
      },
    });

    return NextResponse.json({ sessionId: session.id, initialStage: initialStageNum });
  } catch (error) {
    console.error("ASSESSMENT START-AC ERROR:", error);
    return NextResponse.json({ error: "Failed to start assessment centre." }, { status: 500 });
  }
}
