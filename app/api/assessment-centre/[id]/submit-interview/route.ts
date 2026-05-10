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

  const rl = checkRateLimit(userId, "assessment-centre-interview", 20, 3600);
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
  const { results, summary } = parsed.data;

  const overallScore = (summary as Record<string, unknown>)?.overall_score ?? 0;
  const interviewScore = typeof overallScore === "number" ? overallScore : 0;

  // Generate presentation brief
  const systemPrompt = `You are a senior assessment centre designer. Generate a realistic presentation brief appropriate for a ${session.role} candidate in the ${session.sector} sector. JSON only.`;
  const userPrompt = `Generate a presentation brief for a ${session.role} in ${session.sector}. Return JSON: { "topic": "<topic string>", "audience": "<audience string>", "context": "<2-3 sentences of background>", "format": "3-minute spoken presentation", "objectives": ["<objective 1>", "<objective 2>", "<objective 3>"], "timeMinutes": 3 }`;

  const aiResponse = await callOpenAIChat({
    model: "gpt-4o",
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
    brief = {
      topic: "Strategic market expansion",
      audience: "Senior leadership team",
      context: "The company is evaluating opportunities for growth in new markets.",
      format: "3-minute spoken presentation",
      objectives: ["Present a clear recommendation", "Back it with evidence", "Outline key risks"],
      timeMinutes: 3,
    };
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

  return NextResponse.json({ brief });
}
