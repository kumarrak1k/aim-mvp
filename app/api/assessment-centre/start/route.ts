import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { callOpenAIChat } from "@/app/lib/openai-client";
import { MODEL_PREMIUM } from "@/app/lib/aiModels";
import { buildCaseStudyPrompts, buildPresentationBriefPrompts } from "@/app/lib/assessmentCentrePrompts";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { parseJsonBody } from "@/app/lib/validation";
import { getCandidatePlan, TRIAL_USAGE_CAPS } from "@/app/lib/candidatePlan";

export const runtime = "nodejs";
export const maxDuration = 180;
export const dynamic = "force-dynamic";

const startSchema = z.object({
  role: z.string().trim().min(1).max(200),
  sector: z.string().trim().min(1).max(100),
  experienceLevel: z.string().trim().min(1).max(80),
  selectedStages: z
    .array(z.enum(["stage1", "stage2", "stage3"]))
    .min(1)
    .default(["stage1", "stage2", "stage3"]),
});

function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const rl = await checkRateLimit(userId, "assessment-centre-start", 10, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const plan = await getCandidatePlan(userId);
  if (!plan.isProfessional) {
    return NextResponse.json(
      { error: "Assessment centre requires the Professional plan." },
      { status: 403 }
    );
  }

  // Fair-usage cap during the free trial (cost control). Paid Professional is
  // unlimited; the cap only applies while access comes from the no-card trial.
  if (plan.isTrial) {
    const since = plan.trialStartedAt ? new Date(plan.trialStartedAt) : undefined;
    const used = await prisma.assessmentCentreSession.count({
      where: { clerkUserId: userId, ...(since && { createdAt: { gte: since } }) },
    });
    if (used >= TRIAL_USAGE_CAPS.assessmentCentres) {
      return NextResponse.json(
        {
          error: `Your free trial includes ${TRIAL_USAGE_CAPS.assessmentCentres} mock assessment centres. Upgrade to Professional for unlimited assessment centres.`,
        },
        { status: 429 }
      );
    }
  }

  const parsed = await parseJsonBody(request, startSchema);
  if ("response" in parsed) return parsed.response;
  const { role, sector, experienceLevel, selectedStages } = parsed.data;

  const hasStage1 = selectedStages.includes("stage1");
  const hasStage2 = selectedStages.includes("stage2");
  const hasStage3 = selectedStages.includes("stage3");

  // Determine initial status based on first selected stage
  const initialStatus = hasStage1 ? "stage1" : hasStage2 ? "stage2" : "stage3";
  const initialStageNum = hasStage1 ? 1 : hasStage2 ? 2 : 3;

  let scenario: unknown = null;
  let presentationBrief: unknown = null;

  // When stage3 is the only selected stage, generate the brief now — there is
  // no submit-case-study or submit-interview call to generate it later.
  if (!hasStage1 && !hasStage2 && hasStage3) {
    const { systemPrompt: briefSystemPrompt, userPrompt: briefUserPrompt } =
      buildPresentationBriefPrompts({ role, sector });

    const briefResponse = await callOpenAIChat({
      model: MODEL_PREMIUM,
      messages: [
        { role: "system", content: briefSystemPrompt },
        { role: "user", content: briefUserPrompt },
      ],
      temperature: 0.8,
      max_tokens: 800,
    }, { timeoutMs: 45000 });

    const rawBrief = stripMarkdownFences(briefResponse.choices[0].message.content);
    try {
      presentationBrief = JSON.parse(rawBrief);
    } catch {
      presentationBrief = { topic: "Strategic market expansion", audience: "Senior leadership team", context: "The company is evaluating growth opportunities.", format: "3-minute spoken presentation", objectives: ["Present a clear recommendation", "Back it with evidence", "Outline key risks"], timeMinutes: 3 };
    }
  }

  if (hasStage1) {
    // Company names and challenges this candidate has already seen. Without this
    // the generator has no memory, so repeat runs on the same role produce the
    // same business with a different invented name.
    const priorSessions = await prisma.assessmentCentreSession.findMany({
      where: { clerkUserId: userId, caseStudyScenario: { not: Prisma.DbNull } },
      select: { caseStudyScenario: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
    const recentScenarios = priorSessions
      .map((s) => {
        const sc = s.caseStudyScenario as { company?: string; challenge?: string } | null;
        if (!sc?.company) return null;
        const gist = sc.challenge ? ` (${sc.challenge.slice(0, 120)})` : "";
        return `${sc.company}${gist}`;
      })
      .filter((v): v is string => Boolean(v));
    const { systemPrompt, userPrompt } = buildCaseStudyPrompts({
      role,
      sector,
      experienceLevel,
      recentScenarios,
    });

    const aiResponse = await callOpenAIChat({
      model: MODEL_PREMIUM,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 2000,
    }, { timeoutMs: 90000 });

    const raw = stripMarkdownFences(aiResponse.choices[0].message.content);
    try {
      scenario = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Failed to parse scenario from AI." }, { status: 500 });
    }
  }

  const session = await prisma.assessmentCentreSession.create({
    data: {
      clerkUserId: userId,
      role,
      sector,
      experienceLevel,
      selectedStages,
      status: initialStatus,
      currentStage: initialStageNum,
      ...(scenario ? { caseStudyScenario: scenario as object } : {}),
      ...(presentationBrief ? { presentationBrief: presentationBrief as object } : {}),
    },
  });

  return NextResponse.json({ id: session.id, ...(scenario ? { scenario } : {}) });
}
