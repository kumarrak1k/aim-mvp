import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { callOpenAIChat } from "@/app/lib/openai-client";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { parseJsonBody } from "@/app/lib/validation";
import { moderateText } from "@/app/lib/moderation";
import { getCandidatePlan } from "@/app/lib/candidatePlan";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const submitSchema = z.object({
  response: z.string().trim().min(1).max(20000),
  timeMs: z.number().int().min(0),
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

  const rl = await checkRateLimit(userId, "assessment-centre-case-study", 20, 3600);
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
  const { response, timeMs } = parsed.data;

  // Moderate candidate free-text before it's scored, stored, and shown to the
  // hiring team.
  if ((await moderateText(response)).flagged) {
    return NextResponse.json(
      { error: "Your response couldn't be submitted as it was flagged by our content filter." },
      { status: 400 }
    );
  }

  const scenario = JSON.stringify(session.caseStudyScenario);

  const systemPrompt = `You are a senior assessor scoring a case study response from a ${session.role} candidate (${session.experienceLevel}). Score rigorously and honestly. Output valid JSON only.`;

  const userPrompt = `You are scoring a case study response.

SCENARIO:
${scenario}

CANDIDATE RESPONSE:
${response}

Score the response and return JSON with this exact structure:
{
  "scores": {
    "structure": <number 1-10>,
    "analysis": <number 1-10>,
    "recommendations": <number 1-10>,
    "commercialAwareness": <number 1-10>,
    "communication": <number 1-10>
  },
  "overall": <number 1-10, weighted average>,
  "commentary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "modelAnswer": "<2-3 sentences describing what an excellent response would include>",
  "exampleAnswer": "<A full model answer written as if by an ideal candidate — 250-350 words, structured and specific to this scenario and question, using data from the exhibits where relevant. Write it as a direct response, not a description of one.>"
}`;

  const aiResponse = await callOpenAIChat({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 2500,
  }, { timeoutMs: 60000 });

  const raw = stripMarkdownFences(aiResponse.choices[0].message.content);
  let feedback: unknown;
  try {
    feedback = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Failed to parse feedback from AI." }, { status: 500 });
  }

  const fb = feedback as { overall?: number };
  const caseStudyScore = typeof fb.overall === "number" ? fb.overall : 0;

  const stages = session.selectedStages as string[];
  const hasStage2 = stages.includes("stage2");
  const hasStage3 = stages.includes("stage3");

  if (hasStage2) {
    // Proceed to interview stage
    await prisma.assessmentCentreSession.update({
      where: { id },
      data: {
        caseStudyResponse: response,
        caseStudyFeedback: feedback as object,
        caseStudyScore,
        caseStudyTimeMs: timeMs,
        status: "stage2",
        currentStage: 2,
      },
    });
    return NextResponse.json({ feedback });
  }

  if (hasStage3) {
    // Skip interview — generate presentation brief and move to stage 3
    const briefSystemPrompt = `You are a senior assessment centre designer. Generate a realistic presentation brief appropriate for a ${session.role} candidate in the ${session.sector} sector. JSON only.`;
    const briefUserPrompt = `Generate a presentation brief for a ${session.role} in ${session.sector}. Return JSON: { "topic": "<topic string>", "audience": "<audience string>", "context": "<2-3 sentences of background>", "format": "3-minute spoken presentation", "objectives": ["<objective 1>", "<objective 2>", "<objective 3>"], "timeMinutes": 3 }`;

    const briefResponse = await callOpenAIChat({
      model: "gpt-4o",
      messages: [
        { role: "system", content: briefSystemPrompt },
        { role: "user", content: briefUserPrompt },
      ],
      temperature: 0.8,
      max_tokens: 800,
    }, { timeoutMs: 45000 });

    const rawBrief = stripMarkdownFences(briefResponse.choices[0].message.content);
    let brief: unknown;
    try {
      brief = JSON.parse(rawBrief);
    } catch {
      brief = { topic: "Strategic market expansion", audience: "Senior leadership team", context: "The company is evaluating growth opportunities.", format: "3-minute spoken presentation", objectives: ["Present a clear recommendation", "Back it with evidence", "Outline key risks"], timeMinutes: 3 };
    }

    await prisma.assessmentCentreSession.update({
      where: { id },
      data: {
        caseStudyResponse: response,
        caseStudyFeedback: feedback as object,
        caseStudyScore,
        caseStudyTimeMs: timeMs,
        presentationBrief: brief as object,
        status: "stage3",
        currentStage: 3,
      },
    });
    return NextResponse.json({ feedback });
  }

  // Only stage 1 selected — generate final report now
  const overallScore = caseStudyScore;
  const reportSystemPrompt = `You are a chief assessor generating a final Assessment Centre report. JSON only.`;
  const reportUserPrompt = `Generate a final assessment centre report for a candidate who completed only the Case Study stage.

CANDIDATE: ${session.role} (${session.experienceLevel}) in ${session.sector}
CASE STUDY SCORE: ${caseStudyScore}/10
CASE STUDY FEEDBACK: ${JSON.stringify(feedback)}

Return JSON:
{
  "overallScore": ${overallScore},
  "readinessLevel": "<'High' if >=7, 'Moderate' if 5-6.9, 'Developing' if <5>",
  "headline": "<one strong sentence summarising the candidate>",
  "competencyScores": { "analyticalThinking": <1-10>, "communication": <1-10>, "commercialAwareness": <1-10>, "leadership": <1-10>, "problemSolving": <1-10> },
  "stageScores": { "caseStudy": ${caseStudyScore}, "interview": 0, "presentation": 0 },
  "topStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "priorityImprovements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "sevenDayPlan": ["<day 1>", "<day 2>", "<day 3>", "<day 4>", "<day 5>", "<day 6>", "<day 7>"],
  "finalRecommendation": "<2-3 sentence recommendation>"
}`;

  const reportResponse = await callOpenAIChat({
    model: "gpt-4o",
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
      headline: "A focused candidate assessed on case study performance.",
      competencyScores: { analyticalThinking: 6, communication: 6, commercialAwareness: 6, leadership: 6, problemSolving: 6 },
      stageScores: { caseStudy: caseStudyScore, interview: 0, presentation: 0 },
      topStrengths: ["Structured thinking", "Written communication", "Analytical approach"],
      priorityImprovements: ["Deeper data analysis", "Sharper recommendations", "More commercial context"],
      sevenDayPlan: ["Review a case study framework", "Practice timed written analysis", "Study your target sector", "Read analyst reports", "Write 3 mock case study responses", "Review feedback carefully", "Set 3 specific development goals"],
      finalRecommendation: "The candidate shows analytical potential and would benefit from further practice across all assessment centre stages.",
    };
  }

  await prisma.assessmentCentreSession.update({
    where: { id },
    data: {
      caseStudyResponse: response,
      caseStudyFeedback: feedback as object,
      caseStudyScore,
      caseStudyTimeMs: timeMs,
      overallScore,
      report: report as object,
      status: "complete",
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ feedback });
}
