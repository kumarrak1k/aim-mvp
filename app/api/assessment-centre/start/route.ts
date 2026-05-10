import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { callOpenAIChat } from "@/app/lib/openai-client";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { parseJsonBody } from "@/app/lib/validation";

export const runtime = "nodejs";
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

async function getUserPlanInfo(userId: string): Promise<{ planName: string; isAdvanced: boolean }> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const meta = user.privateMetadata as {
      subscriptionStatus?: string;
      stripePlanId?: string;
    };
    const isActive = meta?.subscriptionStatus === "active";
    const planId = (meta?.stripePlanId ?? "").toLowerCase();
    if (!isActive) return { planName: "Free", isAdvanced: false };
    if (planId.includes("advanced")) return { planName: "Advanced", isAdvanced: true };
    return { planName: "Professional", isAdvanced: false };
  } catch {
    return { planName: "Free", isAdvanced: false };
  }
}

function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const rl = checkRateLimit(userId, "assessment-centre-start", 10, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const planInfo = await getUserPlanInfo(userId);
  if (!planInfo.isAdvanced) {
    return NextResponse.json(
      { error: "Assessment centre requires the Advanced plan." },
      { status: 403 }
    );
  }

  const parsed = await parseJsonBody(request, startSchema);
  if ("response" in parsed) return parsed.response;
  const { role, sector, experienceLevel, selectedStages } = parsed.data;

  const hasStage1 = selectedStages.includes("stage1");
  const hasStage2 = selectedStages.includes("stage2");

  // Determine initial status based on first selected stage
  const initialStatus = hasStage1 ? "stage1" : hasStage2 ? "stage2" : "stage3";
  const initialStageNum = hasStage1 ? 1 : hasStage2 ? 2 : 3;

  let scenario: unknown = null;

  if (hasStage1) {
    const systemPrompt = `You are a senior assessment centre designer creating realistic business case studies for graduate and professional candidates. Generate a rigorous, realistic scenario appropriate for ${role} at ${experienceLevel} in the ${sector} sector. Output must be valid JSON only, no markdown.`;

    const userPrompt = `Create a case study scenario for a ${role} candidate (${experienceLevel}) in the ${sector} sector. Include: a realistic company name and industry, 3-4 sentence background, a clear business challenge, 2-3 data exhibits with realistic numbers (as markdown tables or bullet lists), a 12-minute timed task instruction, a specific question, and 4 guidance tips for structuring the response. Return JSON matching this schema exactly: { company, industry, overview, challenge, exhibits: [{title, content}], task, question, guidance: [] }`;

    const aiResponse = await callOpenAIChat({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }, { timeoutMs: 60000 });

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
    },
  });

  return NextResponse.json({ id: session.id, ...(scenario ? { scenario } : {}) });
}
