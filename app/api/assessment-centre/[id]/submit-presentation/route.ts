import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { callOpenAIChat } from "@/app/lib/openai-client";
import { MODEL_PREMIUM } from "@/app/lib/aiModels";
import { AC_SCORING_CALIBRATION } from "@/app/lib/assessmentCentrePrompts";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { parseJsonBody } from "@/app/lib/validation";
import { moderateText } from "@/app/lib/moderation";
import { getCandidatePlan } from "@/app/lib/candidatePlan";
import { canSubmitAssessmentCentreStage } from "@/app/lib/freeTaster";
import { recordActivity, ACTIVITY_EVENTS } from "@/app/lib/activity";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const submitSchema = z.object({
  transcript: z.string().trim().min(1).max(20000),
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

  const rl = await checkRateLimit(userId, "assessment-centre-presentation", 20, 3600);
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
    if (!(await canSubmitAssessmentCentreStage(userId, plan))) {
      recordActivity(userId, ACTIVITY_EVENTS.AC_BLOCKED, plan, {
        reason: "plan",
        stage: "presentation",
      });
      return NextResponse.json(
        { error: "Assessment centre requires the Professional plan." },
        { status: 403 }
      );
    }
  }

  recordActivity(userId, ACTIVITY_EVENTS.AC_STAGE_SUBMITTED, null, {
    stage: "presentation",
    sessionId: session.id,
  });

  const parsed = await parseJsonBody(request, submitSchema);
  if ("response" in parsed) return parsed.response;
  const { transcript } = parsed.data;

  // Moderate candidate free-text before scoring/storage/recruiter view.
  if ((await moderateText(transcript)).flagged) {
    return NextResponse.json(
      { error: "Your submission couldn't be processed as it was flagged by our content filter." },
      { status: 400 }
    );
  }

  // Score the presentation
  const scoreSystemPrompt = `You are a senior assessor scoring a presentation transcript from a ${session.role} candidate (${session.experienceLevel}) in the ${session.sector} sector. Output valid JSON only.

${AC_SCORING_CALIBRATION}`;

  const briefStr = session.presentationBrief ? JSON.stringify(session.presentationBrief) : "No brief available.";
  const scoreUserPrompt = `Score this presentation transcript.

BRIEF:
${briefStr}

TRANSCRIPT:
${transcript}

Return JSON:
{
  "scores": {
    "structure": <number 1-10>,
    "content": <number 1-10>,
    "persuasion": <number 1-10>,
    "clarity": <number 1-10>,
    "delivery": <number 1-10>
  },
  "overall": <number 1-10>,
  "commentary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "exampleAnswer": "<A model presentation answer written as a spoken script — structured with a clear opening, 2-3 key points with evidence from the brief, and a strong closing recommendation. Around 200-250 words. Write it as actual spoken words the candidate could deliver, not a description of what to include.>"
}`;

  const scoreResponse = await callOpenAIChat({
    model: MODEL_PREMIUM,
    messages: [
      { role: "system", content: scoreSystemPrompt },
      { role: "user", content: scoreUserPrompt },
    ],
    temperature: 0.3,
    max_tokens: 2200,
  }, { timeoutMs: 60000 });

  const rawScore = stripMarkdownFences(scoreResponse.choices[0].message.content);
  let feedback: unknown;
  try {
    feedback = JSON.parse(rawScore);
  } catch {
    return NextResponse.json({ error: "Failed to parse presentation feedback." }, { status: 500 });
  }

  const fb = feedback as { overall?: number };
  const presentationScore = typeof fb.overall === "number" ? fb.overall : 0;

  // Update with presentation data (status → generating_report)
  await prisma.assessmentCentreSession.update({
    where: { id },
    data: {
      presentationResponse: transcript,
      presentationFeedback: feedback as object,
      presentationScore,
      status: "generating_report",
    },
  });

  // Generate final report
  const caseStudyScore = session.caseStudyScore ?? 0;
  const interviewScore = session.interviewScore ?? 0;
  const selectedStages = session.selectedStages as string[];
  const hasCS = selectedStages.includes("stage1");
  const hasIV = selectedStages.includes("stage2");

  let overallScore: number;
  if (hasCS && hasIV) {
    overallScore = Math.round((caseStudyScore * 0.3 + interviewScore * 0.4 + presentationScore * 0.3) * 10) / 10;
  } else if (hasCS) {
    overallScore = Math.round((caseStudyScore * 0.5 + presentationScore * 0.5) * 10) / 10;
  } else if (hasIV) {
    overallScore = Math.round((interviewScore * 0.6 + presentationScore * 0.4) * 10) / 10;
  } else {
    overallScore = presentationScore;
  }

  const csFeedback = session.caseStudyFeedback ? JSON.stringify(session.caseStudyFeedback) : "No feedback";
  const ivSummary = session.interviewSummary ? JSON.stringify(session.interviewSummary) : "No summary";

  const reportSystemPrompt = `You are a chief assessor generating a final Assessment Centre report. Synthesise performance across all three stages. Be rigorous, specific and honest. JSON only.`;

  const reportUserPrompt = `Generate a final assessment centre report.

CANDIDATE: ${session.role} (${session.experienceLevel}) in ${session.sector}

STAGE SCORES:
- Case Study: ${caseStudyScore}/10
- Interview: ${interviewScore}/10
- Presentation: ${presentationScore}/10
- Weighted Overall: ${overallScore}/10

CASE STUDY FEEDBACK:
${csFeedback}

INTERVIEW SUMMARY:
${ivSummary}

PRESENTATION FEEDBACK:
${JSON.stringify(feedback)}

Return JSON:
{
  "overallScore": ${overallScore},
  "readinessLevel": "<'High' if >=7, 'Moderate' if 5-6.9, 'Developing' if <5>",
  "headline": "<one strong sentence summarising the candidate>",
  "competencyScores": {
    "analyticalThinking": <number 1-10>,
    "communication": <number 1-10>,
    "commercialAwareness": <number 1-10>,
    "leadership": <number 1-10>,
    "problemSolving": <number 1-10>
  },
  "stageScores": {
    "caseStudy": ${caseStudyScore},
    "interview": ${interviewScore},
    "presentation": ${presentationScore}
  },
  "topStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "priorityImprovements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "sevenDayPlan": ["<day 1 action>", "<day 2 action>", "<day 3 action>", "<day 4 action>", "<day 5 action>", "<day 6 action>", "<day 7 action>"],
  "finalRecommendation": "<2-3 sentence hiring recommendation>"
}`;

  const reportResponse = await callOpenAIChat({
    model: MODEL_PREMIUM,
    messages: [
      { role: "system", content: reportSystemPrompt },
      { role: "user", content: reportUserPrompt },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  }, { timeoutMs: 90000 });

  const rawReport = stripMarkdownFences(reportResponse.choices[0].message.content);
  let report: unknown;
  try {
    report = JSON.parse(rawReport);
  } catch {
    report = {
      overallScore,
      readinessLevel: overallScore >= 7 ? "High" : overallScore >= 5 ? "Moderate" : "Developing",
      headline: "A capable candidate with clear areas for development.",
      competencyScores: { analyticalThinking: 6, communication: 6, commercialAwareness: 6, leadership: 6, problemSolving: 6 },
      stageScores: { caseStudy: caseStudyScore, interview: interviewScore, presentation: presentationScore },
      topStrengths: ["Structured thinking", "Clear communication", "Commercial awareness"],
      priorityImprovements: ["Deeper analysis", "More specific examples", "Stronger recommendations"],
      sevenDayPlan: [
        "Review a case study framework (e.g. MECE)",
        "Practice STAR method with a timer",
        "Record and review a 3-minute presentation",
        "Read one industry report in your target sector",
        "Write out 5 strong STAR examples from your experience",
        "Do a mock interview with a peer or mentor",
        "Review your assessment centre feedback and set 3 specific goals",
      ],
      finalRecommendation: "The candidate shows promise but requires further development before being assessment centre ready.",
    };
  }

  const rpt = report as { overallScore?: number };
  const finalOverall = typeof rpt.overallScore === "number" ? rpt.overallScore : overallScore;

  await prisma.assessmentCentreSession.update({
    where: { id },
    data: {
      overallScore: finalOverall,
      report: report as object,
      status: "complete",
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ report });
}
