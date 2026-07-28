import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { callOpenAIChat } from "@/app/lib/openai-client";
import { MODEL_PREMIUM } from "@/app/lib/aiModels";
import { buildPresentationBriefPrompts } from "@/app/lib/assessmentCentrePrompts";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { parseJsonBody } from "@/app/lib/validation";
import { getCandidatePlan } from "@/app/lib/candidatePlan";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const submitSchema = z.object({
  results: z.array(z.unknown()),
  summary: z.unknown(),
});

function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const rl = await checkRateLimit(userId, "assessment-centre-interview", 20, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const { id } = await params;

  const session = await prisma.assessmentCentreSession.findUnique({ where: { id } });
  if (!session || session.clerkUserId !== userId) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  // Re-check entitlement on submit (not just at start). SELF-SERVE assessment
  // centres are Professional-only, so a user who lapsed or downgraded mid-flow
  // can't keep generating AI scoring. COMPANY-FUNDED sessions (created from a
  // corporate invite — assignmentToken set) are paid for by the company and are
  // bounded by the corporate invite caps, so the candidate's own plan doesn't
  // gate them.
  if (!session.assignmentToken) {
    const plan = await getCandidatePlan(userId);
    if (!plan.isProfessional) {
      return NextResponse.json(
        { error: "Assessment centre requires the Professional plan." },
        { status: 403 }
      );
    }
  }

  const parsed = await parseJsonBody(request, submitSchema);
  if ("response" in parsed) return parsed.response;
  const { results, summary } = parsed.data;

  const rawOverall = (summary as Record<string, unknown>)?.overall_score ?? 0;
  const interviewScore = typeof rawOverall === "number" ? rawOverall : 0;

  const stages = session.selectedStages as string[];
  const hasStage3 = stages.includes("stage3");

  if (hasStage3) {
    // Generate presentation brief and proceed to stage 3
    const { systemPrompt, userPrompt } = buildPresentationBriefPrompts({
      role: session.role,
      sector: session.sector,
    });

    const aiResponse = await callOpenAIChat({
      model: MODEL_PREMIUM,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 800,
    }, { timeoutMs: 45000 });

    const raw = stripMarkdownFences(aiResponse.choices[0].message.content);
    let brief: unknown;
    try {
      brief = JSON.parse(raw);
    } catch {
      brief = { topic: "Strategic market expansion", audience: "Senior leadership team", context: "The company is evaluating opportunities for growth in new markets.", format: "3-minute spoken presentation", objectives: ["Present a clear recommendation", "Back it with evidence", "Outline key risks"], timeMinutes: 3 };
    }

    await prisma.assessmentCentreSession.update({
      where: { id },
      data: {
        interviewResults: results as object[],
        interviewSummary: summary as object,
        interviewScore,
        presentationBrief: brief as object,
        status: "stage3",
        currentStage: 3,
      },
    });

    return NextResponse.json({ brief, nextStage: "stage3" });
  }

  // Stage 3 not selected — generate final report with available scores
  const caseStudyScore = session.caseStudyScore ?? 0;
  const stages2 = stages as string[];
  const hasStage1 = stages2.includes("stage1");

  // Dynamic weighting based on completed stages
  let overallScore: number;
  if (hasStage1) {
    // CS 30% + Interview 40% / total 70% → proportional
    overallScore = Math.round(((caseStudyScore * 3 + interviewScore * 4) / 7) * 10) / 10;
  } else {
    overallScore = interviewScore;
  }

  const csFeedback = session.caseStudyFeedback ? JSON.stringify(session.caseStudyFeedback) : "Not completed";

  const reportSystemPrompt = `You are a chief assessor generating a final Assessment Centre report. JSON only.`;
  const reportUserPrompt = `Generate a final assessment centre report for a candidate who completed the following stages: ${hasStage1 ? "Case Study, " : ""}Interview.

CANDIDATE: ${session.role} (${session.experienceLevel}) in ${session.sector}
${hasStage1 ? `CASE STUDY SCORE: ${caseStudyScore}/10
CASE STUDY FEEDBACK: ${csFeedback}
` : ""}INTERVIEW SCORE: ${interviewScore}/10
INTERVIEW SUMMARY: ${JSON.stringify(summary)}

Return JSON:
{
  "overallScore": ${overallScore},
  "readinessLevel": "<'High' if >=7, 'Moderate' if 5-6.9, 'Developing' if <5>",
  "headline": "<one strong sentence summarising the candidate>",
  "competencyScores": { "analyticalThinking": <1-10>, "communication": <1-10>, "commercialAwareness": <1-10>, "leadership": <1-10>, "problemSolving": <1-10> },
  "stageScores": { "caseStudy": ${caseStudyScore}, "interview": ${interviewScore}, "presentation": 0 },
  "topStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "priorityImprovements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "sevenDayPlan": ["<day 1>", "<day 2>", "<day 3>", "<day 4>", "<day 5>", "<day 6>", "<day 7>"],
  "finalRecommendation": "<2-3 sentence recommendation>"
}`;

  const reportResponse = await callOpenAIChat({
    model: MODEL_PREMIUM,
    messages: [
      { role: "system", content: reportSystemPrompt },
      { role: "user", content: reportUserPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1800,
  }, { timeoutMs: 90000 });

  const rawReport = stripMarkdownFences(reportResponse.choices[0].message.content);
  let report: unknown;
  try {
    report = JSON.parse(rawReport);
  } catch {
    report = {
      overallScore,
      readinessLevel: overallScore >= 7 ? "High" : overallScore >= 5 ? "Moderate" : "Developing",
      headline: "A capable candidate assessed on interview performance.",
      competencyScores: { analyticalThinking: 6, communication: 6, commercialAwareness: 6, leadership: 6, problemSolving: 6 },
      stageScores: { caseStudy: caseStudyScore, interview: interviewScore, presentation: 0 },
      topStrengths: ["Strong verbal communication", "Structured thinking", "Confident delivery"],
      priorityImprovements: ["Deeper examples", "More specific outcomes", "Stronger commercial context"],
      sevenDayPlan: ["Review your STAR examples", "Practice competency questions aloud", "Record yourself answering", "Study your target sector", "Prepare 10 strong STAR stories", "Do a mock interview", "Set 3 specific goals"],
      finalRecommendation: "The candidate demonstrates solid interview skills and would benefit from practising across all assessment centre stages.",
    };
  }

  await prisma.assessmentCentreSession.update({
    where: { id },
    data: {
      interviewResults: results as object[],
      interviewSummary: summary as object,
      interviewScore,
      overallScore,
      report: report as object,
      status: "complete",
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ report, nextStage: "report" });
}
