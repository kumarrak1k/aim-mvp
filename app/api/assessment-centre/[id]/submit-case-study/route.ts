import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { callOpenAIChat } from "@/app/lib/openai-client";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { parseJsonBody } from "@/app/lib/validation";

export const runtime = "nodejs";
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

  const rl = checkRateLimit(userId, "assessment-centre-case-study", 20, 3600);
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

  const parsed = await parseJsonBody(request, submitSchema);
  if ("response" in parsed) return parsed.response;
  const { response, timeMs } = parsed.data;

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
  "modelAnswer": "<A brief example of what an excellent response would include>"
}`;

  const aiResponse = await callOpenAIChat({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  }, { timeoutMs: 60000 });

  const raw = stripMarkdownFences(aiResponse.choices[0].message.content);
  let feedback: unknown;
  try {
    feedback = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Failed to parse feedback from AI." }, { status: 500 });
  }

  const fb = feedback as { overall?: number };
  const overallScore = typeof fb.overall === "number" ? fb.overall : 0;

  await prisma.assessmentCentreSession.update({
    where: { id },
    data: {
      caseStudyResponse: response,
      caseStudyFeedback: feedback as object,
      caseStudyScore: overallScore,
      caseStudyTimeMs: timeMs,
      status: "stage2",
      currentStage: 2,
    },
  });

  return NextResponse.json({ feedback });
}
